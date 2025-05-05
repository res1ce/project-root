import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFireStationDto } from './dto/create-fire-station.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class FireStationService {
  constructor(private prisma: PrismaService) {}

  async createFireStation(dto: CreateFireStationDto) {
    return this.prisma.fireStation.create({
      data: {
        name: dto.name,
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
    });
  }

  async getAll(userId?: number, userRole?: UserRole | string) {
    console.log(`[DEBUG] FireStationService.getAll: запрос с userId=${userId}, userRole=${userRole}`);
    
    // Проверяем роль пользователя (может быть как строка, так и enum)
    const isStationDispatcher = 
      userRole === UserRole.STATION_DISPATCHER || 
      userRole === 'station_dispatcher' || 
      userRole === 'STATION_DISPATCHER';
    
    // Если пользователь - диспетчер станции, возвращаем только его часть
    if (userId && isStationDispatcher) {
      console.log(`[DEBUG] FireStationService.getAll: пользователь - диспетчер станции`);
      
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { fireStationId: true }
      });

      console.log(`[DEBUG] FireStationService.getAll: fireStationId пользователя = ${user?.fireStationId}`);

      if (!user?.fireStationId) {
        throw new NotFoundException('Пользователь не привязан к пожарной части');
      }

      const stations = await this.prisma.fireStation.findMany({
        where: { id: user.fireStationId }
      });
      
      console.log(`[DEBUG] FireStationService.getAll: найдено ${stations.length} пожарных частей для диспетчера станции`);
      return stations;
    }

    console.log(`[DEBUG] FireStationService.getAll: пользователь - центральный диспетчер или администратор`);
    
    // Для центрального диспетчера и администратора возвращаем все части
    const stations = await this.prisma.fireStation.findMany();
    console.log(`[DEBUG] FireStationService.getAll: найдено всего ${stations.length} пожарных частей`);
    return stations;
  }

  async getById(id: number) {
    return this.prisma.fireStation.findUnique({ where: { id } });
  }

  async update(id: number, dto: CreateFireStationDto) {
    return this.prisma.fireStation.update({
      where: { id },
      data: {
        name: dto.name,
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
    });
  }

  async delete(id: number) {
    return this.prisma.fireStation.delete({ where: { id } });
  }
}
