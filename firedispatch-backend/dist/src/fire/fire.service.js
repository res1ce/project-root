"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FireService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const fire_events_gateway_1 = require("./fire-events.gateway");
const client_1 = require("@prisma/client");
let FireService = class FireService {
    events;
    prisma;
    constructor(events, prisma) {
        this.events = events;
        this.prisma = prisma;
    }
    async create(dto) {
        console.log(`[DEBUG] Исходные координаты пожара:`, JSON.stringify(dto.location));
        if (!dto.location || !Array.isArray(dto.location) || dto.location.length !== 2) {
            console.error('[ERROR] Некорректный формат координат пожара:', dto.location);
            throw new common_1.BadRequestException('Некорректные координаты местоположения пожара');
        }
        const [longitude, latitude] = dto.location;
        console.log(`[DEBUG] Извлеченные координаты пожара: широта=${latitude}, долгота=${longitude}`);
        if (typeof latitude !== 'number' || typeof longitude !== 'number' ||
            isNaN(latitude) || isNaN(longitude)) {
            console.error('[ERROR] Координаты не являются числами:', { latitude, longitude });
            throw new common_1.BadRequestException('Координаты должны быть числами');
        }
        if (dto.autoLevel) {
            const fireLevelNumber = await this.determineFireLevel(dto.location, dto.address);
            const fireLevel = await this.getLevelByNumber(fireLevelNumber);
            if (fireLevel) {
                dto.levelId = fireLevel.id;
            }
            else {
                const firstLevel = await this.getFirstLevel();
                if (firstLevel) {
                    dto.levelId = firstLevel.id;
                }
                else {
                    throw new common_1.BadRequestException('В системе не настроены уровни пожаров');
                }
            }
        }
        if (!dto.levelId) {
            throw new common_1.BadRequestException('Необходимо указать уровень пожара или включить автоматическое определение');
        }
        const fireLevel = await this.prisma.fireLevel.findUnique({
            where: { id: dto.levelId },
            include: {
                requirements: true
            }
        });
        if (!fireLevel) {
            throw new common_1.NotFoundException(`Уровень пожара с ID ${dto.levelId} не найден`);
        }
        const fireStations = await this.prisma.fireStation.findMany();
        console.log(`[DEBUG] Получено ${fireStations.length} пожарных частей`);
        fireStations.forEach(station => {
            console.log(`[DEBUG] Пожарная часть ${station.name} (id: ${station.id}): координаты [${station.latitude}, ${station.longitude}]`);
        });
        const sortedStations = fireStations
            .map(station => {
            const distance = this.calculateDistance(latitude, longitude, station.latitude, station.longitude);
            return {
                ...station,
                distance
            };
        })
            .sort((a, b) => a.distance - b.distance);
        console.log(`[DEBUG] Отсортированные станции по расстоянию:`);
        sortedStations.forEach((station, index) => {
            console.log(`[DEBUG] ${index + 1}. ${station.name} (id: ${station.id}): ${station.distance.toFixed(3)} км`);
        });
        if (sortedStations.length === 0) {
            throw new common_1.BadRequestException('Нет доступных пожарных частей');
        }
        let selectedStation = null;
        let assignedVehicles = [];
        const requirements = await this.prisma.fireLevelRequirement.findMany({
            where: { fireLevelId: fireLevel.id }
        });
        console.log(`[DEBUG] Найдено ${requirements.length} требований к технике для уровня ${fireLevel.level}`);
        if (requirements.length === 0) {
            console.log(`[DEBUG] Нет требований к технике, выбираем ближайшую пожарную часть`);
            selectedStation = sortedStations[0];
            console.log(`[DEBUG] Выбрана ближайшая станция: ${selectedStation.name} (id: ${selectedStation.id}) на расстоянии ${selectedStation.distance.toFixed(3)} км`);
        }
        else {
            console.log(`[DEBUG] Проверяем наличие необходимой техники в пожарных частях`);
            for (const station of sortedStations) {
                console.log(`[DEBUG] Проверяем станцию ${station.name} (id: ${station.id}) на расстоянии ${station.distance.toFixed(3)} км`);
                const availableVehicles = await this.prisma.vehicle.findMany({
                    where: {
                        fireStationId: station.id,
                        status: client_1.VehicleStatus.AVAILABLE
                    }
                });
                console.log(`[DEBUG] Доступно ${availableVehicles.length} единиц техники на станции ${station.name}`);
                let hasAllRequired = true;
                const assignedVehiclesForStation = [];
                for (const requirement of requirements) {
                    const availableOfType = availableVehicles.filter(v => v.type === requirement.vehicleType &&
                        !assignedVehiclesForStation.includes(v.id));
                    console.log(`[DEBUG] Требуется ${requirement.count} единиц техники типа ${requirement.vehicleType}, доступно: ${availableOfType.length}`);
                    if (availableOfType.length < requirement.count) {
                        hasAllRequired = false;
                        console.log(`[DEBUG] Недостаточно техники на станции ${station.name} для требования: нужно ${requirement.count}, доступно ${availableOfType.length}`);
                        break;
                    }
                    for (let i = 0; i < requirement.count; i++) {
                        assignedVehiclesForStation.push(availableOfType[i].id);
                    }
                }
                if (hasAllRequired) {
                    selectedStation = station;
                    assignedVehicles = assignedVehiclesForStation;
                    console.log(`[DEBUG] Выбрана станция ${selectedStation.name} (id: ${selectedStation.id}) с достаточным количеством техники`);
                    break;
                }
            }
            if (!selectedStation && sortedStations.length > 0) {
                selectedStation = sortedStations[0];
                console.log(`[DEBUG] Не найдено станций с достаточным количеством техники. Выбрана ближайшая: ${selectedStation.name}`);
            }
        }
        if (!selectedStation) {
            throw new common_1.BadRequestException('Не удалось выбрать пожарную часть');
        }
        const fireData = {
            latitude,
            longitude,
            status: dto.status || client_1.IncidentStatus.PENDING,
            fireStationId: selectedStation.id,
            fireLevelId: fireLevel.id,
            reportedById: dto.reportedById
        };
        if (dto.address)
            fireData.address = dto.address;
        if (dto.description)
            fireData.description = dto.description;
        if (dto.assignedToId)
            fireData.assignedToId = dto.assignedToId;
        const fireIncident = await this.prisma.fireIncident.create({
            data: fireData,
            include: {
                reportedBy: true,
                assignedTo: true,
                fireStation: true,
                fireLevel: true
            }
        });
        console.log(`[DEBUG] Назначаем ${assignedVehicles.length} единиц техники на пожар #${fireIncident.id}`);
        if (assignedVehicles.length === 0) {
            console.log(`[DEBUG] Нет назначенной техники, получаем всю доступную технику выбранной части`);
            const stationVehicles = await this.prisma.vehicle.findMany({
                where: {
                    fireStationId: selectedStation.id,
                    status: client_1.VehicleStatus.AVAILABLE
                },
                take: 2
            });
            if (stationVehicles.length > 0) {
                console.log(`[DEBUG] Найдено ${stationVehicles.length} единиц доступной техники`);
                assignedVehicles = stationVehicles;
            }
            else {
                console.log(`[DEBUG] Не найдено доступной техники в выбранной части`);
            }
        }
        const updatedVehicles = [];
        for (const vehicle of assignedVehicles) {
            console.log(`[DEBUG] Назначаем технику ID: ${vehicle.id}, модель: ${vehicle.model} на пожар #${fireIncident.id}`);
            try {
                const updatedVehicle = await this.prisma.vehicle.update({
                    where: { id: typeof vehicle === 'object' ? vehicle.id : vehicle },
                    data: {
                        status: client_1.VehicleStatus.ON_DUTY,
                        incidents: {
                            connect: { id: fireIncident.id }
                        }
                    }
                });
                updatedVehicles.push(updatedVehicle);
                console.log(`[DEBUG] Техника ID: ${updatedVehicle.id} успешно назначена и статус изменен на ON_DUTY`);
            }
            catch (error) {
                console.error(`[ERROR] Ошибка при назначении техники ID: ${vehicle.id || vehicle}:`, error);
            }
        }
        console.log(`[DEBUG] Успешно назначено ${updatedVehicles.length} единиц техники из ${assignedVehicles.length}`);
        const fireLevel1 = await this.prisma.fireLevel.findUnique({
            where: { id: fireLevel.id },
            select: {
                id: true,
                level: true,
                name: true
            }
        });
        const fireStation = await this.prisma.fireStation.findUnique({
            where: { id: selectedStation.id }
        });
        const completeFireData = await this.prisma.fireIncident.findUnique({
            where: { id: fireIncident.id },
            include: {
                fireLevel: true,
                fireStation: true,
                reportedBy: {
                    select: { id: true, name: true }
                }
            }
        });
        this.events.fireCreated({
            ...completeFireData,
            level: fireLevel1?.level || fireLevel.level,
            status: fireIncident.status
        });
        this.events.fireAssigned({
            id: fireIncident.id,
            fire: completeFireData,
            assignedStationId: selectedStation.id
        });
        console.log(`[DEBUG] Создан пожар #${fireIncident.id}, уровень ${fireLevel.level}, назначен станции ${selectedStation.name}`);
        return {
            ...fireIncident,
            assignedVehicles: assignedVehicles.map(v => ({ id: v.id, type: v.type, name: v.name }))
        };
    }
    getReadableStatus(status) {
        const statusMap = {
            [client_1.IncidentStatus.PENDING]: 'Ожидает обработки',
            [client_1.IncidentStatus.IN_PROGRESS]: 'В процессе тушения',
            [client_1.IncidentStatus.RESOLVED]: 'Потушен',
            [client_1.IncidentStatus.CANCELLED]: 'Отменен'
        };
        return statusMap[status] || status;
    }
    async getAll(userId, userRole) {
        console.log(`[DEBUG] FireService.getAll: запрос с userId=${userId}, userRole=${userRole}`);
        const isStationDispatcher = userRole === client_1.UserRole.STATION_DISPATCHER ||
            userRole === 'station_dispatcher' ||
            userRole === 'STATION_DISPATCHER';
        if (userId && isStationDispatcher) {
            console.log(`[DEBUG] FireService.getAll: пользователь - диспетчер станции`);
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { fireStationId: true }
            });
            console.log(`[DEBUG] FireService.getAll: fireStationId пользователя = ${user?.fireStationId}`);
            if (!user?.fireStationId) {
                throw new common_1.BadRequestException('Пользователь не привязан к пожарной части');
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
            return fires.map(fire => ({
                ...fire,
                readableStatus: this.getReadableStatus(fire.status)
            }));
        }
        console.log(`[DEBUG] FireService.getAll: пользователь - центральный диспетчер или администратор`);
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
        return fires.map(fire => ({
            ...fire,
            readableStatus: this.getReadableStatus(fire.status)
        }));
    }
    async getById(id) {
        const fireId = Number(id);
        if (!fireId || isNaN(fireId))
            throw new common_1.BadRequestException('Некорректный id');
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
        if (!fire)
            return null;
        return {
            ...fire,
            readableStatus: this.getReadableStatus(fire.status)
        };
    }
    async update(id, dto) {
        const fireId = Number(id);
        if (!fireId || isNaN(fireId))
            throw new common_1.BadRequestException('Некорректный id');
        let latitude, longitude;
        if (dto.location) {
            [longitude, latitude] = dto.location;
        }
        const updateData = {};
        if (dto.location) {
            updateData.latitude = latitude;
            updateData.longitude = longitude;
        }
        if (dto.levelId) {
            const fireLevel = await this.prisma.fireLevel.findUnique({
                where: { id: dto.levelId }
            });
            if (!fireLevel) {
                throw new common_1.NotFoundException(`Уровень пожара с ID ${dto.levelId} не найден`);
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
        this.events.fireUpdated({
            id: updatedFire.id,
            status: updatedFire.status,
            level: updatedFire.fireLevel.level,
            assignedStation: updatedFire.fireStation
        });
        return updatedFire;
    }
    async delete(id) {
        const fireId = Number(id);
        if (!fireId || isNaN(fireId))
            throw new Error('Некорректный id');
        await this.releaseVehiclesByFireId(fireId);
        const deletedFire = await this.prisma.fireIncident.delete({
            where: { id: fireId }
        });
        this.events.fireUpdated({ id: fireId, status: 'DELETED' });
        return deletedFire;
    }
    async getAssignmentsByFireId(fireId) {
        const fire = await this.prisma.fireIncident.findUnique({
            where: { id: fireId },
            include: {
                vehicles: true
            }
        });
        if (!fire) {
            throw new common_1.NotFoundException(`Пожар с id ${fireId} не найден`);
        }
        return fire.vehicles;
    }
    async releaseVehiclesByFireId(fireId) {
        const fire = await this.prisma.fireIncident.findUnique({
            where: { id: fireId },
            include: {
                vehicles: true
            }
        });
        if (!fire) {
            throw new common_1.NotFoundException(`Пожар с id ${fireId} не найден`);
        }
        for (const vehicle of fire.vehicles) {
            await this.prisma.vehicle.update({
                where: { id: vehicle.id },
                data: {
                    status: client_1.VehicleStatus.AVAILABLE,
                    incidents: {
                        disconnect: { id: fireId }
                    }
                }
            });
        }
        return { released: fire.vehicles.length };
    }
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
    async getLevelById(id) {
        return this.prisma.fireLevel.findUnique({
            where: { id },
            include: {
                requirements: true
            }
        });
    }
    async getLevelByNumber(level) {
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
    async createLevel(dto) {
        const existingLevel = await this.prisma.fireLevel.findUnique({
            where: { level: dto.level }
        });
        if (existingLevel) {
            throw new common_1.BadRequestException(`Уровень пожара ${dto.level} уже существует`);
        }
        return this.prisma.fireLevel.create({
            data: {
                level: dto.level,
                name: dto.name,
                description: dto.description
            }
        });
    }
    async updateLevel(id, dto) {
        const levelId = Number(id);
        if (isNaN(levelId)) {
            throw new common_1.BadRequestException('Некорректный ID уровня пожара');
        }
        const level = await this.prisma.fireLevel.findUnique({
            where: { id: levelId }
        });
        if (!level) {
            throw new common_1.NotFoundException(`Уровень пожара с ID ${id} не найден`);
        }
        if (dto.level !== level.level) {
            const existingLevel = await this.prisma.fireLevel.findUnique({
                where: { level: dto.level }
            });
            if (existingLevel && existingLevel.id !== levelId) {
                throw new common_1.BadRequestException(`Уровень пожара ${dto.level} уже существует`);
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
    async deleteLevel(id) {
        const levelId = Number(id);
        if (isNaN(levelId)) {
            throw new common_1.BadRequestException('Некорректный ID уровня пожара');
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
            throw new common_1.NotFoundException(`Уровень пожара с ID ${id} не найден`);
        }
        if (level.incidents.length > 0) {
            throw new common_1.BadRequestException(`Невозможно удалить уровень, так как он используется в активных инцидентах`);
        }
        return this.prisma.fireLevel.delete({
            where: { id: levelId }
        });
    }
    async changeFireLevel(fireId, dto) {
        const existingFire = await this.prisma.fireIncident.findUnique({
            where: { id: fireId },
            include: { fireLevel: true }
        });
        if (!existingFire) {
            throw new common_1.NotFoundException(`Пожар с ID ${fireId} не найден`);
        }
        const newLevel = await this.prisma.fireLevel.findUnique({
            where: { id: dto.newLevel }
        });
        if (!newLevel) {
            throw new common_1.NotFoundException(`Уровень пожара с ID ${dto.newLevel} не найден`);
        }
        if (existingFire.fireLevelId === dto.newLevel) {
            throw new common_1.BadRequestException('Новый уровень пожара совпадает с текущим');
        }
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
    async setFireStatus(id, status) {
        const fireId = Number(id);
        if (isNaN(fireId)) {
            throw new common_1.BadRequestException('Некорректный ID пожара');
        }
        const fire = await this.prisma.fireIncident.findUnique({
            where: { id: fireId }
        });
        if (!fire) {
            throw new common_1.NotFoundException(`Пожар с ID ${id} не найден`);
        }
        const updateData = {
            status
        };
        if (status === client_1.IncidentStatus.RESOLVED) {
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
        if (status === client_1.IncidentStatus.RESOLVED || status === client_1.IncidentStatus.CANCELLED) {
            await this.releaseVehiclesByFireId(fireId);
        }
        this.events.fireUpdated({
            id: updatedFire.id,
            status: updatedFire.status,
            level: updatedFire.fireLevel.level,
            assignedStation: updatedFire.fireStation
        });
        return updatedFire;
    }
    deg2rad(deg) {
        return deg * (Math.PI / 180);
    }
    async determineFireLevel(location, address) {
        const [longitude, latitude] = location;
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
            const addressesWithDistance = addressesWithCoordinates
                .filter(addr => addr.latitude && addr.longitude)
                .map(addr => ({
                ...addr,
                distance: this.calculateDistance(latitude, longitude, addr.latitude, addr.longitude)
            }))
                .sort((a, b) => a.distance - b.distance);
            const nearbyAddress = addressesWithDistance[0];
            if (nearbyAddress && nearbyAddress.distance < 0.5) {
                console.log(`[DEBUG] Найден ближайший адрес с координатами на расстоянии ${nearbyAddress.distance.toFixed(3)} км с уровнем ${nearbyAddress.fireLevel.level}`);
                return nearbyAddress.fireLevel.level;
            }
        }
        const lowestLevel = await this.prisma.fireLevel.findFirst({
            orderBy: {
                level: 'asc'
            }
        });
        console.log(`[DEBUG] Не найдено совпадений по адресу или координатам, используется минимальный уровень ${lowestLevel?.level || 1}`);
        return lowestLevel ? lowestLevel.level : 1;
    }
    calculateDistance(lat1, lon1, lat2, lon2) {
        console.log(`[DEBUG] Расчет расстояния между точками [${lat1}, ${lon1}] и [${lat2}, ${lon2}]`);
        if (typeof lat1 !== 'number' || typeof lon1 !== 'number' ||
            typeof lat2 !== 'number' || typeof lon2 !== 'number' ||
            isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
            console.error('[ERROR] Некорректные координаты в calculateDistance');
            return Number.MAX_SAFE_INTEGER;
        }
        const R = 6371;
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        console.log(`[DEBUG] Рассчитанное расстояние: ${distance.toFixed(3)} км`);
        return distance;
    }
    async getFireHistory(fireId) {
        const fire = await this.prisma.fireIncident.findUnique({
            where: { id: fireId }
        });
        if (!fire) {
            throw new common_1.NotFoundException(`Пожар с ID ${fireId} не найден`);
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
    async getAllRequirements() {
        return this.prisma.fireLevelRequirement.findMany({
            include: {
                fireLevel: true
            }
        });
    }
    async getRequirementsByLevel(levelId) {
        const level = await this.prisma.fireLevel.findUnique({
            where: { id: levelId }
        });
        if (!level) {
            throw new common_1.NotFoundException(`Уровень пожара с ID ${levelId} не найден`);
        }
        return this.prisma.fireLevelRequirement.findMany({
            where: {
                fireLevelId: levelId
            }
        });
    }
    async getRequirementById(id) {
        if (isNaN(id)) {
            throw new common_1.BadRequestException('Некорректный ID требования');
        }
        const requirement = await this.prisma.fireLevelRequirement.findUnique({
            where: { id },
            include: {
                fireLevel: true
            }
        });
        if (!requirement) {
            throw new common_1.NotFoundException(`Требование с ID ${id} не найдено`);
        }
        return requirement;
    }
    async createRequirement(dto) {
        const level = await this.prisma.fireLevel.findUnique({
            where: { id: dto.fireLevelId }
        });
        if (!level) {
            throw new common_1.NotFoundException(`Уровень пожара с ID ${dto.fireLevelId} не найден`);
        }
        const existingRequirement = await this.prisma.fireLevelRequirement.findFirst({
            where: {
                fireLevelId: dto.fireLevelId,
                vehicleType: dto.vehicleType
            }
        });
        if (existingRequirement) {
            throw new common_1.BadRequestException(`Требование для типа машины ${dto.vehicleType} на уровне ${level.level} уже существует`);
        }
        return this.prisma.fireLevelRequirement.create({
            data: {
                fireLevel: {
                    connect: { id: dto.fireLevelId }
                },
                vehicleType: dto.vehicleType,
                count: dto.count
            },
            include: {
                fireLevel: true
            }
        });
    }
    async updateRequirement(id, dto) {
        if (isNaN(id)) {
            throw new common_1.BadRequestException('Некорректный ID требования');
        }
        const requirement = await this.prisma.fireLevelRequirement.findUnique({
            where: { id }
        });
        if (!requirement) {
            throw new common_1.NotFoundException(`Требование с ID ${id} не найдено`);
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
    async deleteRequirement(id) {
        if (isNaN(id)) {
            throw new common_1.BadRequestException('Некорректный ID требования');
        }
        const requirement = await this.prisma.fireLevelRequirement.findUnique({
            where: { id }
        });
        if (!requirement) {
            throw new common_1.NotFoundException(`Требование с ID ${id} не найдено`);
        }
        return this.prisma.fireLevelRequirement.delete({
            where: { id }
        });
    }
    async getAllAddressLevels() {
        return this.prisma.fireAddressLevel.findMany({
            include: {
                fireLevel: true
            }
        });
    }
    async getAddressLevelById(id) {
        if (isNaN(id)) {
            throw new common_1.BadRequestException('Некорректный ID адресного правила');
        }
        const addressLevel = await this.prisma.fireAddressLevel.findUnique({
            where: { id },
            include: {
                fireLevel: true
            }
        });
        if (!addressLevel) {
            throw new common_1.NotFoundException(`Адресное правило с ID ${id} не найдено`);
        }
        return addressLevel;
    }
    async createAddressLevel(data) {
        const fireLevel = await this.prisma.fireLevel.findUnique({
            where: { id: data.fireLevelId }
        });
        if (!fireLevel) {
            throw new common_1.NotFoundException(`Уровень пожара с ID ${data.fireLevelId} не найден`);
        }
        const existingAddress = await this.prisma.fireAddressLevel.findFirst({
            where: {
                address: {
                    equals: data.address,
                    mode: 'insensitive'
                }
            }
        });
        if (existingAddress) {
            throw new common_1.BadRequestException(`Адрес ${data.address} уже существует в базе данных`);
        }
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
    async updateAddressLevel(id, data) {
        if (isNaN(id)) {
            throw new common_1.BadRequestException('Некорректный ID адресного правила');
        }
        const existing = await this.prisma.fireAddressLevel.findUnique({
            where: { id }
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Адресное правило с ID ${id} не найдено`);
        }
        if (data.fireLevelId) {
            const fireLevel = await this.prisma.fireLevel.findUnique({
                where: { id: data.fireLevelId }
            });
            if (!fireLevel) {
                throw new common_1.NotFoundException(`Уровень пожара с ID ${data.fireLevelId} не найден`);
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
    async deleteAddressLevel(id) {
        if (isNaN(id)) {
            throw new common_1.BadRequestException('Некорректный ID адресного правила');
        }
        const existing = await this.prisma.fireAddressLevel.findUnique({
            where: { id }
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Адресное правило с ID ${id} не найдено`);
        }
        return this.prisma.fireAddressLevel.delete({
            where: { id }
        });
    }
};
exports.FireService = FireService;
exports.FireService = FireService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(fire_events_gateway_1.FireEventsGateway)),
    __metadata("design:paramtypes", [fire_events_gateway_1.FireEventsGateway,
        prisma_service_1.PrismaService])
], FireService);
//# sourceMappingURL=fire.service.js.map