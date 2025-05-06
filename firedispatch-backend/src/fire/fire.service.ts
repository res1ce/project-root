import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFireDto } from './dto/create-fire.dto';
import { FireEventsGateway } from './fire-events.gateway';
import { IncidentStatus, VehicleStatus, VehicleType, UserRole } from '@prisma/client';
import { CreateFireLevelDto } from './dto/create-firelevel.dto';
import { ChangeFireLevelDto } from './dto/change-fire-level.dto';
import { CreateFireLevelRequirementDto } from './dto/create-firelevel-requirement.dto';

@Injectable()
export class FireService {
  constructor(
    @Inject(FireEventsGateway) private readonly events: FireEventsGateway,
    private readonly prisma: PrismaService
  ) {}

  async create(dto: CreateFireDto) {
    // Если уровень пожара не указан, определяем автоматически
    if (!dto.levelId) {
      dto.levelId = await this.determineFireLevel(dto.location, dto.address);
    }

    // 1. Получаем уровень пожара
    const fireLevel = await this.prisma.fireLevel.findUnique({
      where: { level: dto.levelId },
      include: {
        requirements: true
      }
    });

    if (!fireLevel) {
      throw new NotFoundException(`Уровень пожара ${dto.levelId} не найден`);
    }

    // 2. Находим ближайшую пожарную часть
    const fireStations = await this.prisma.fireStation.findMany();
    
    // Extract latitude and longitude from location array
    const [longitude, latitude] = dto.location;
    
    // Функция для расчета расстояния между двумя точками (используя формулу Хаверсина)
    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371; // Радиус Земли в км
      const dLat = this.deg2rad(lat2 - lat1);
      const dLon = this.deg2rad(lon2 - lon1);
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      return R * c; // Расстояние в км
    };
    
    // Сортируем станции по расстоянию
    const sortedStations = fireStations
      .map(station => ({
        ...station,
        distance: getDistance(latitude, longitude, station.latitude, station.longitude)
      }))
      .sort((a, b) => a.distance - b.distance);
    
    if (sortedStations.length === 0) {
      throw new BadRequestException('Нет доступных пожарных частей');
    }
    
    // 3. Создаем инцидент
    const fireIncident = await this.prisma.fireIncident.create({
      data: {
        latitude,
        longitude,
        status: dto.status as IncidentStatus || IncidentStatus.PENDING,
        reportedBy: {
          connect: { id: dto.reportedById }
        },
        assignedTo: {
          connect: { id: dto.assignedToId || dto.reportedById }
        },
        fireStation: {
          connect: { id: dto.assignedStationId || sortedStations[0].id }
        },
        fireLevel: {
          connect: { id: fireLevel.id }
        }
      },
      include: {
        reportedBy: true,
        assignedTo: true,
        fireStation: true,
        fireLevel: true
      }
    });
    
    // 4. Получаем доступные машины из ближайшей части
    const availableVehicles = await this.prisma.vehicle.findMany({
      where: {
        fireStationId: sortedStations[0].id,
        status: VehicleStatus.AVAILABLE
      }
    });
    
    // 5. Получаем требования к машинам для этого уровня
    const requiredVehicles = fireLevel.requirements;
    
    const assignedVehicles = [];
    
    for (const requirement of requiredVehicles) {
      const matchingVehicles = availableVehicles
        .filter(v => v.type === requirement.vehicleType)
        .slice(0, requirement.count);
      
      for (const vehicle of matchingVehicles) {
        await this.prisma.vehicle.update({
          where: { id: vehicle.id },
          data: {
            status: VehicleStatus.ON_DUTY,
            incidents: {
              connect: { id: fireIncident.id }
            }
          }
        });
        
        assignedVehicles.push(vehicle);
      }
    }
    
    // 6. Если не хватает машин в ближайшей части, переназначаем на следующую ближайшую
    const requiredVehicleCount = requiredVehicles.reduce((sum, r) => sum + r.count, 0);
    if (assignedVehicles.length < requiredVehicleCount && sortedStations.length > 1) {
      // Обновляем назначение
      await this.prisma.fireIncident.update({
        where: { id: fireIncident.id },
        data: {
          fireStation: {
            connect: { id: sortedStations[1].id }
          }
        }
      });
      
      // TODO: В реальном приложении здесь нужна более сложная логика
    }
    
    // 7. Отправляем уведомление через WebSocket
    this.events.fireCreated({
      id: fireIncident.id,
      latitude: fireIncident.latitude,
      longitude: fireIncident.longitude,
      level: fireIncident.fireLevel.level,
      status: fireIncident.status,
      assignedStation: fireIncident.fireStation
    });
    
    return {
      ...fireIncident,
      assignedVehicles
    };
  }

  // Преобразование статуса пожара в человекочитаемый формат
  private getReadableStatus(status: IncidentStatus): string {
    const statusMap = {
      [IncidentStatus.PENDING]: 'Ожидает обработки',
      [IncidentStatus.IN_PROGRESS]: 'В процессе тушения',
      [IncidentStatus.RESOLVED]: 'Потушен',
      [IncidentStatus.CANCELLED]: 'Отменен'
    };
    return statusMap[status] || status;
  }

  // Изменяем метод getAll
  async getAll(userId?: number, userRole?: UserRole | string) {
    console.log(`[DEBUG] FireService.getAll: запрос с userId=${userId}, userRole=${userRole}`);
    
    // Проверяем роль пользователя (может быть как строка, так и enum)
    const isStationDispatcher = 
      userRole === UserRole.STATION_DISPATCHER || 
      userRole === 'station_dispatcher' || 
      userRole === 'STATION_DISPATCHER';
    
    // Если пользователь - диспетчер пожарной части, показываем только пожары его части
    if (userId && isStationDispatcher) {
      console.log(`[DEBUG] FireService.getAll: пользователь - диспетчер станции`);
      
      // Определяем пожарную часть пользователя
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { fireStationId: true }
      });

      console.log(`[DEBUG] FireService.getAll: fireStationId пользователя = ${user?.fireStationId}`);

      if (!user?.fireStationId) {
        throw new BadRequestException('Пользователь не привязан к пожарной части');
      }

      const fires = await this.prisma.fireIncident.findMany({
        where: { fireStationId: user.fireStationId },
        include: {
          reportedBy: {
            select: { id: true, name: true, role: true }
          },
          assignedTo: {
            select: { id: true, name: true, role: true }
          },
          fireStation: true,
          vehicles: true,
          reports: true,
          fireLevel: true
        }
      });

      console.log(`[DEBUG] FireService.getAll: найдено ${fires.length} пожаров для части ${user.fireStationId}`);

      // Добавляем человекочитаемый статус
      return fires.map(fire => ({
        ...fire,
        readableStatus: this.getReadableStatus(fire.status)
      }));
    }

    console.log(`[DEBUG] FireService.getAll: пользователь - центральный диспетчер или администратор`);
    
    // Центральный диспетчер или администратор видит все пожары
    const fires = await this.prisma.fireIncident.findMany({
      include: {
        reportedBy: {
          select: { id: true, name: true, role: true }
        },
        assignedTo: {
          select: { id: true, name: true, role: true }
        },
        fireStation: true,
        vehicles: true,
        reports: true,
        fireLevel: true
      }
    });

    console.log(`[DEBUG] FireService.getAll: найдено всего ${fires.length} пожаров`);

    // Добавляем человекочитаемый статус
    return fires.map(fire => ({
      ...fire,
      readableStatus: this.getReadableStatus(fire.status)
    }));
  }

  async getById(id: number) {
    const fireId = Number(id);
    if (!fireId || isNaN(fireId)) throw new BadRequestException('Некорректный id');

    const fire = await this.prisma.fireIncident.findUnique({
      where: { id: fireId },
      include: {
        reportedBy: {
          select: { id: true, name: true, role: true }
        },
        assignedTo: {
          select: { id: true, name: true, role: true }
        },
        fireStation: true,
        vehicles: true,
        reports: true,
        fireLevel: {
          include: {
            requirements: true
          }
        }
      }
    });

    if (!fire) return null;

    // Добавляем человекочитаемый статус
    return {
      ...fire,
      readableStatus: this.getReadableStatus(fire.status)
    };
  }

  async update(id: number, dto: CreateFireDto) {
    const fireId = Number(id);
    if (!fireId || isNaN(fireId)) throw new BadRequestException('Некорректный id');

    // Extract latitude and longitude if location provided
    let latitude, longitude;
    if (dto.location) {
      [longitude, latitude] = dto.location;
    }

    const updateData: any = {};
    
    // Only update fields that are provided
    if (dto.location) {
      updateData.latitude = latitude;
      updateData.longitude = longitude;
    }
    
    if (dto.levelId) {
      // Поиск по id вместо level
      const fireLevel = await this.prisma.fireLevel.findUnique({
        where: { id: dto.levelId }
      });
      
      if (!fireLevel) {
        throw new NotFoundException(`Уровень пожара с ID ${dto.levelId} не найден`);
      }
      
      updateData.fireLevel = {
        connect: { id: fireLevel.id }
      };
    }
    
    if (dto.status) {
      updateData.status = dto.status;
    }
    
    if (dto.description !== undefined) {
      updateData.description = dto.description;
    }
    
    if (dto.assignedToId) {
      updateData.assignedTo = {
        connect: { id: dto.assignedToId }
      };
    }
    
    if (dto.assignedStationId) {
      updateData.fireStation = {
        connect: { id: dto.assignedStationId }
      };
    }

    const updatedFire = await this.prisma.fireIncident.update({
      where: { id: fireId },
      data: updateData,
      include: {
        reportedBy: true,
        assignedTo: true,
        fireStation: true,
        vehicles: true,
        fireLevel: true
      }
    });

    // Уведомляем через WebSocket об обновлении
    this.events.fireUpdated({
      id: updatedFire.id,
      status: updatedFire.status,
      level: updatedFire.fireLevel.level,
      assignedStation: updatedFire.fireStation
    });

    return updatedFire;
  }

  async delete(id: number) {
    const fireId = Number(id);
    if (!fireId || isNaN(fireId)) throw new Error('Некорректный id');

    // Освобождаем машины перед удалением инцидента
    await this.releaseVehiclesByFireId(fireId);

    // Удаляем инцидент
    const deletedFire = await this.prisma.fireIncident.delete({
      where: { id: fireId }
    });

    // Уведомляем через WebSocket
    this.events.fireUpdated({ id: fireId, status: 'DELETED' });

    return deletedFire;
  }

  async getAssignmentsByFireId(fireId: number) {
    const fire = await this.prisma.fireIncident.findUnique({
      where: { id: fireId },
      include: {
        vehicles: true
      }
    });
    
    if (!fire) {
      throw new NotFoundException(`Пожар с id ${fireId} не найден`);
    }
    
    return fire.vehicles;
  }

  async releaseVehiclesByFireId(fireId: number) {
    const fire = await this.prisma.fireIncident.findUnique({
      where: { id: fireId },
      include: {
        vehicles: true
      }
    });
    
    if (!fire) {
      throw new NotFoundException(`Пожар с id ${fireId} не найден`);
    }
    
    // Освобождаем все автомобили, связанные с этим пожаром
    for (const vehicle of fire.vehicles) {
      await this.prisma.vehicle.update({
        where: { id: vehicle.id },
        data: {
          status: VehicleStatus.AVAILABLE,
          incidents: {
            disconnect: { id: fireId }
          }
        }
      });
    }
    
    return { released: fire.vehicles.length };
  }

  // --- Методы для управления конфигурацией уровней пожара ---
  
  async getAllLevels() {
    return this.prisma.fireLevel.findMany({
      include: {
        requirements: true
      },
      orderBy: {
        level: 'asc'
      }
    });
  }

  async getLevelById(id: number) {
    return this.prisma.fireLevel.findUnique({
      where: { id },
      include: {
        requirements: true
      }
    });
  }
  
  async getLevelByNumber(level: number) {
    return this.prisma.fireLevel.findUnique({
      where: { level }
    });
  }
  
  async getFirstLevel() {
    return this.prisma.fireLevel.findFirst({
      orderBy: {
        level: 'asc'
      }
    });
  }

  async createLevel(dto: CreateFireLevelDto) {
    const existingLevel = await this.prisma.fireLevel.findUnique({
      where: { level: dto.level }
    });
    
    if (existingLevel) {
      throw new BadRequestException(`Уровень пожара ${dto.level} уже существует`);
    }
    
    return this.prisma.fireLevel.create({
      data: {
        level: dto.level,
        name: dto.name,
        description: dto.description
      }
    });
  }

  async updateLevel(id: number, dto: CreateFireLevelDto) {
    const levelId = Number(id);
    if (isNaN(levelId)) {
      throw new BadRequestException('Некорректный ID уровня пожара');
    }
    
    const level = await this.prisma.fireLevel.findUnique({
      where: { id: levelId }
    });
    
    if (!level) {
      throw new NotFoundException(`Уровень пожара с ID ${id} не найден`);
    }
    
    // Проверяем, что уровень с таким номером не существует у другого объекта
    if (dto.level !== level.level) {
      const existingLevel = await this.prisma.fireLevel.findUnique({
        where: { level: dto.level }
      });
      
      if (existingLevel && existingLevel.id !== levelId) {
        throw new BadRequestException(`Уровень пожара ${dto.level} уже существует`);
      }
    }
    
    return this.prisma.fireLevel.update({
      where: { id: levelId },
      data: {
        level: dto.level,
        name: dto.name,
        description: dto.description
      }
    });
  }

  async deleteLevel(id: number) {
    const levelId = Number(id);
    if (isNaN(levelId)) {
      throw new BadRequestException('Некорректный ID уровня пожара');
    }
    
    const level = await this.prisma.fireLevel.findUnique({
      where: { id: levelId },
      include: {
        incidents: {
          take: 1
        }
      }
    });
    
    if (!level) {
      throw new NotFoundException(`Уровень пожара с ID ${id} не найден`);
    }
    
    // Проверяем, что уровень не используется в активных инцидентах
    if (level.incidents.length > 0) {
      throw new BadRequestException(`Невозможно удалить уровень, так как он используется в активных инцидентах`);
    }
    
    return this.prisma.fireLevel.delete({
      where: { id: levelId }
    });
  }

  async changeFireLevel(fireId: number, dto: ChangeFireLevelDto) {
    // Проверяем, существует ли пожар
    const existingFire = await this.prisma.fireIncident.findUnique({
      where: { id: fireId },
      include: { fireLevel: true }
    });
    
    if (!existingFire) {
      throw new NotFoundException(`Пожар с ID ${fireId} не найден`);
    }
    
    // Проверяем, существует ли новый уровень пожара по ID
    const newLevel = await this.prisma.fireLevel.findUnique({
      where: { id: dto.newLevel }
    });
    
    if (!newLevel) {
      throw new NotFoundException(`Уровень пожара с ID ${dto.newLevel} не найден`);
    }
    
    // Проверяем, отличается ли новый уровень от текущего
    if (existingFire.fireLevelId === dto.newLevel) {
      throw new BadRequestException('Новый уровень пожара совпадает с текущим');
    }
    
    // Записываем изменение в историю
    await this.prisma.fireHistory.create({
      data: {
        fireIncidentId: fireId,
        action: 'LEVEL_CHANGE',
        details: JSON.stringify({
          oldLevelId: existingFire.fireLevelId,
          oldLevelName: existingFire.fireLevel.name,
          newLevelId: dto.newLevel,
          newLevelName: newLevel.name,
          reason: dto.reason || 'Не указана'
        })
      }
    });
    
    // Обновляем уровень пожара
    return this.prisma.fireIncident.update({
      where: { id: fireId },
      data: { 
        fireLevelId: dto.newLevel,
        updatedAt: new Date()
      },
      include: {
        fireLevel: true
      }
    });
  }

  async setFireStatus(id: number, status: IncidentStatus) {
    const fireId = Number(id);
    if (isNaN(fireId)) {
      throw new BadRequestException('Некорректный ID пожара');
    }
    
    const fire = await this.prisma.fireIncident.findUnique({
      where: { id: fireId }
    });
    
    if (!fire) {
      throw new NotFoundException(`Пожар с ID ${id} не найден`);
    }
    
    const updateData: any = {
      status
    };
    
    // Если пожар помечен как разрешенный, добавляем дату разрешения
    if (status === IncidentStatus.RESOLVED) {
      updateData.resolvedAt = new Date();
    }
    
    const updatedFire = await this.prisma.fireIncident.update({
      where: { id: fireId },
      data: updateData,
      include: {
        fireLevel: true,
        fireStation: true
      }
    });
    
    // Если пожар разрешен или отменен, освобождаем все машины
    if (status === IncidentStatus.RESOLVED || status === IncidentStatus.CANCELLED) {
      await this.releaseVehiclesByFireId(fireId);
    }
    
    // Уведомляем через WebSocket
    this.events.fireUpdated({
      id: updatedFire.id,
      status: updatedFire.status,
      level: updatedFire.fireLevel.level,
      assignedStation: updatedFire.fireStation
    });
    
    return updatedFire;
  }

  // Вспомогательная функция для перевода градусов в радианы
  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  // Метод для автоматического определения уровня пожара
  async determineFireLevel(location: [number, number], address?: string): Promise<number> {
    // Извлекаем координаты пожара
    const [longitude, latitude] = location;
    
    // 1. Если указан адрес, проверяем его на точное соответствие в таблице предопределенных уровней
    if (address) {
      const exactAddressMatch = await this.prisma.fireAddressLevel.findFirst({
        where: {
          address: {
            equals: address,
            mode: 'insensitive'
          }
        },
        include: {
          fireLevel: true
        }
      });
      
      if (exactAddressMatch) {
        console.log(`[DEBUG] Найдено точное соответствие адреса "${address}" в базе данных с уровнем ${exactAddressMatch.fireLevel.level}`);
        return exactAddressMatch.fireLevel.level;
      }
      
      // 2. Если точного соответствия нет, ищем по частичному соответствию адреса
      const partialAddressMatch = await this.prisma.fireAddressLevel.findFirst({
        where: {
          address: {
            contains: address,
            mode: 'insensitive'
          }
        },
        include: {
          fireLevel: true
        }
      });
      
      if (partialAddressMatch) {
        console.log(`[DEBUG] Найдено частичное соответствие адреса "${address}" в базе данных с уровнем ${partialAddressMatch.fireLevel.level}`);
        return partialAddressMatch.fireLevel.level;
      }
    }
    
    // 3. Если адрес не найден, ищем по координатам с учетом расстояния
    const addressesWithCoordinates = await this.prisma.fireAddressLevel.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null }
      },
      include: {
        fireLevel: true
      }
    });
    
    if (addressesWithCoordinates.length > 0) {
      // Вычисляем расстояние до каждого адреса и находим ближайший
      const addressesWithDistance = addressesWithCoordinates
        .filter(addr => addr.latitude && addr.longitude) // Дополнительная проверка для TypeScript
        .map(addr => ({
          ...addr,
          distance: this.calculateDistance(
            latitude, 
            longitude, 
            addr.latitude!, 
            addr.longitude!
          )
        }))
        .sort((a, b) => a.distance - b.distance);
      
      // Если есть адрес в радиусе 500 метров, используем его уровень
      const nearbyAddress = addressesWithDistance[0];
      if (nearbyAddress && nearbyAddress.distance < 0.5) { // 0.5 км = 500 метров
        console.log(`[DEBUG] Найден ближайший адрес с координатами на расстоянии ${nearbyAddress.distance.toFixed(3)} км с уровнем ${nearbyAddress.fireLevel.level}`);
        return nearbyAddress.fireLevel.level;
      }
    }
    
    // 4. Если ничего не найдено, возвращаем самый низкий уровень
    const lowestLevel = await this.prisma.fireLevel.findFirst({
      orderBy: {
        level: 'asc'
      }
    });
    
    console.log(`[DEBUG] Не найдено совпадений по адресу или координатам, используется минимальный уровень ${lowestLevel?.level || 1}`);
    return lowestLevel ? lowestLevel.level : 1;
  }
  
  // Вспомогательная функция для расчета расстояния между точками в км (по формуле Хаверсина)
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Радиус Земли в км
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; // Расстояние в км
  }

  // --- Методы для истории пожаров ---
  
  async getFireHistory(fireId: number) {
    const fire = await this.prisma.fireIncident.findUnique({
      where: { id: fireId }
    });
    
    if (!fire) {
      throw new NotFoundException(`Пожар с ID ${fireId} не найден`);
    }
    
    return this.prisma.userActivity.findMany({
      where: {
        details: {
          contains: `fireId:${fireId}`
        }
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });
  }

  // --- Методы для управления требованиями к уровням пожара ---
  
  async getAllRequirements() {
    return this.prisma.fireLevelRequirement.findMany({
      include: {
        fireLevel: true
      }
    });
  }
  
  async getRequirementsByLevel(levelId: number) {
    const level = await this.prisma.fireLevel.findUnique({
      where: { id: levelId }
    });
    
    if (!level) {
      throw new NotFoundException(`Уровень пожара с ID ${levelId} не найден`);
    }
    
    return this.prisma.fireLevelRequirement.findMany({
      where: {
        fireLevelId: levelId
      }
    });
  }
  
  async getRequirementById(id: number) {
    if (isNaN(id)) {
      throw new BadRequestException('Некорректный ID требования');
    }
    
    const requirement = await this.prisma.fireLevelRequirement.findUnique({
      where: { id },
      include: {
        fireLevel: true
      }
    });
    
    if (!requirement) {
      throw new NotFoundException(`Требование с ID ${id} не найдено`);
    }
    
    return requirement;
  }
  
  async createRequirement(dto: CreateFireLevelRequirementDto) {
    const level = await this.prisma.fireLevel.findUnique({
      where: { id: dto.fireLevelId }
    });
    
    if (!level) {
      throw new NotFoundException(`Уровень пожара с ID ${dto.fireLevelId} не найден`);
    }
    
    // Проверяем, не существует ли уже требование для этого типа машины на данном уровне
    const existingRequirement = await this.prisma.fireLevelRequirement.findFirst({
      where: {
        fireLevelId: dto.fireLevelId,
        vehicleType: dto.vehicleType as VehicleType
      }
    });
    
    if (existingRequirement) {
      throw new BadRequestException(`Требование для типа машины ${dto.vehicleType} на уровне ${level.level} уже существует`);
    }
    
    return this.prisma.fireLevelRequirement.create({
      data: {
        fireLevel: {
          connect: { id: dto.fireLevelId }
        },
        vehicleType: dto.vehicleType as VehicleType,
        count: dto.count
      },
      include: {
        fireLevel: true
      }
    });
  }
  
  async updateRequirement(id: number, dto: CreateFireLevelRequirementDto) {
    if (isNaN(id)) {
      throw new BadRequestException('Некорректный ID требования');
    }
    
    const requirement = await this.prisma.fireLevelRequirement.findUnique({
      where: { id }
    });
    
    if (!requirement) {
      throw new NotFoundException(`Требование с ID ${id} не найдено`);
    }
    
    return this.prisma.fireLevelRequirement.update({
      where: { id },
      data: {
        count: dto.count
      },
      include: {
        fireLevel: true
      }
    });
  }
  
  async deleteRequirement(id: number) {
    if (isNaN(id)) {
      throw new BadRequestException('Некорректный ID требования');
    }
    
    const requirement = await this.prisma.fireLevelRequirement.findUnique({
      where: { id }
    });
    
    if (!requirement) {
      throw new NotFoundException(`Требование с ID ${id} не найдено`);
    }
    
    return this.prisma.fireLevelRequirement.delete({
      where: { id }
    });
  }

  // --- Методы для управления адресами с предопределенными уровнями пожаров ---

  async getAllAddressLevels() {
    return this.prisma.fireAddressLevel.findMany({
      include: {
        fireLevel: true
      }
    });
  }

  async getAddressLevelById(id: number) {
    if (isNaN(id)) {
      throw new BadRequestException('Некорректный ID адресного правила');
    }
    
    const addressLevel = await this.prisma.fireAddressLevel.findUnique({
      where: { id },
      include: {
        fireLevel: true
      }
    });
    
    if (!addressLevel) {
      throw new NotFoundException(`Адресное правило с ID ${id} не найдено`);
    }
    
    return addressLevel;
  }

  async createAddressLevel(data: { 
    address: string; 
    fireLevelId: number; 
    description?: string;
    latitude?: number;
    longitude?: number;
  }) {
    // Проверяем, существует ли уровень пожара
    const fireLevel = await this.prisma.fireLevel.findUnique({
      where: { id: data.fireLevelId }
    });
    
    if (!fireLevel) {
      throw new NotFoundException(`Уровень пожара с ID ${data.fireLevelId} не найден`);
    }
    
    // Проверяем, не существует ли уже такой адрес
    const existingAddress = await this.prisma.fireAddressLevel.findFirst({
      where: { 
        address: {
          equals: data.address,
          mode: 'insensitive'
        }
      }
    });
    
    if (existingAddress) {
      throw new BadRequestException(`Адрес ${data.address} уже существует в базе данных`);
    }
    
    // Создаем новую запись с координатами, если они указаны
    return this.prisma.fireAddressLevel.create({
      data: {
        address: data.address,
        description: data.description,
        latitude: data.latitude,
        longitude: data.longitude,
        fireLevel: {
          connect: { id: data.fireLevelId }
        }
      },
      include: {
        fireLevel: true
      }
    });
  }

  async updateAddressLevel(id: number, data: { address?: string; fireLevelId?: number; description?: string }) {
    if (isNaN(id)) {
      throw new BadRequestException('Некорректный ID адресного правила');
    }
    
    // Проверяем существование записи
    const existing = await this.prisma.fireAddressLevel.findUnique({
      where: { id }
    });
    
    if (!existing) {
      throw new NotFoundException(`Адресное правило с ID ${id} не найдено`);
    }
    
    // Проверяем уровень, если он обновляется
    if (data.fireLevelId) {
      const fireLevel = await this.prisma.fireLevel.findUnique({
        where: { id: data.fireLevelId }
      });
      
      if (!fireLevel) {
        throw new NotFoundException(`Уровень пожара с ID ${data.fireLevelId} не найден`);
      }
    }
    
    return this.prisma.fireAddressLevel.update({
      where: { id },
      data: {
        address: data.address,
        description: data.description,
        fireLevel: data.fireLevelId ? {
          connect: { id: data.fireLevelId }
        } : undefined
      },
      include: {
        fireLevel: true
      }
    });
  }

  async deleteAddressLevel(id: number) {
    if (isNaN(id)) {
      throw new BadRequestException('Некорректный ID адресного правила');
    }
    
    const existing = await this.prisma.fireAddressLevel.findUnique({
      where: { id }
    });
    
    if (!existing) {
      throw new NotFoundException(`Адресное правило с ID ${id} не найдено`);
    }
    
    return this.prisma.fireAddressLevel.delete({
      where: { id }
    });
  }
}
