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
        if (!dto.levelId) {
            dto.levelId = await this.determineFireLevel(dto.location, dto.address);
        }
        const fireLevel = await this.prisma.fireLevel.findUnique({
            where: { level: dto.levelId },
            include: {
                requirements: true
            }
        });
        if (!fireLevel) {
            throw new common_1.NotFoundException(`Уровень пожара ${dto.levelId} не найден`);
        }
        const fireStations = await this.prisma.fireStation.findMany();
        const [longitude, latitude] = dto.location;
        const getDistance = (lat1, lon1, lat2, lon2) => {
            const R = 6371;
            const dLat = this.deg2rad(lat2 - lat1);
            const dLon = this.deg2rad(lon2 - lon1);
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        };
        const sortedStations = fireStations
            .map(station => ({
            ...station,
            distance: getDistance(latitude, longitude, station.latitude, station.longitude)
        }))
            .sort((a, b) => a.distance - b.distance);
        if (sortedStations.length === 0) {
            throw new common_1.BadRequestException('Нет доступных пожарных частей');
        }
        const fireIncident = await this.prisma.fireIncident.create({
            data: {
                latitude,
                longitude,
                status: dto.status || client_1.IncidentStatus.PENDING,
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
        const availableVehicles = await this.prisma.vehicle.findMany({
            where: {
                fireStationId: sortedStations[0].id,
                status: client_1.VehicleStatus.AVAILABLE
            }
        });
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
                        status: client_1.VehicleStatus.ON_DUTY,
                        incidents: {
                            connect: { id: fireIncident.id }
                        }
                    }
                });
                assignedVehicles.push(vehicle);
            }
        }
        const requiredVehicleCount = requiredVehicles.reduce((sum, r) => sum + r.count, 0);
        if (assignedVehicles.length < requiredVehicleCount && sortedStations.length > 1) {
            await this.prisma.fireIncident.update({
                where: { id: fireIncident.id },
                data: {
                    fireStation: {
                        connect: { id: sortedStations[1].id }
                    }
                }
            });
        }
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
                requirements: {
                    select: {
                        id: true,
                        count: true,
                        vehicleType: true
                    }
                }
            },
            orderBy: {
                level: 'asc'
            }
        });
    }
    async getLevelById(id) {
        const levelId = Number(id);
        if (isNaN(levelId)) {
            throw new common_1.BadRequestException('Некорректный ID уровня пожара');
        }
        const level = await this.prisma.fireLevel.findUnique({
            where: { id: levelId },
            include: {
                requirements: true
            }
        });
        if (!level) {
            throw new common_1.NotFoundException(`Уровень пожара с ID ${id} не найден`);
        }
        return level;
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
        if (address) {
            const addressLevel = await this.prisma.fireAddressLevel.findFirst({
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
            if (addressLevel) {
                return addressLevel.fireLevel.level;
            }
        }
        const lowestLevel = await this.prisma.fireLevel.findFirst({
            orderBy: {
                level: 'asc'
            }
        });
        return lowestLevel ? lowestLevel.level : 1;
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