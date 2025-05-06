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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FireStationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let FireStationService = class FireStationService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createFireStation(dto) {
        return this.prisma.fireStation.create({
            data: {
                name: dto.name,
                address: dto.address,
                latitude: dto.latitude,
                longitude: dto.longitude,
                phoneNumber: dto.phoneNumber,
            },
        });
    }
    async getAll(userId, userRole) {
        console.log(`[DEBUG] FireStationService.getAll: запрос с userId=${userId}, userRole=${userRole}`);
        const isStationDispatcher = userRole === client_1.UserRole.STATION_DISPATCHER ||
            userRole === 'station_dispatcher' ||
            userRole === 'STATION_DISPATCHER';
        if (userId && isStationDispatcher) {
            console.log(`[DEBUG] FireStationService.getAll: пользователь - диспетчер станции`);
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { fireStationId: true }
            });
            console.log(`[DEBUG] FireStationService.getAll: fireStationId пользователя = ${user?.fireStationId}`);
            if (!user?.fireStationId) {
                throw new common_1.NotFoundException('Пользователь не привязан к пожарной части');
            }
            const stations = await this.prisma.fireStation.findMany({
                where: { id: user.fireStationId }
            });
            console.log(`[DEBUG] FireStationService.getAll: найдено ${stations.length} пожарных частей для диспетчера станции`);
            return stations;
        }
        console.log(`[DEBUG] FireStationService.getAll: пользователь - центральный диспетчер или администратор`);
        const stations = await this.prisma.fireStation.findMany();
        console.log(`[DEBUG] FireStationService.getAll: найдено всего ${stations.length} пожарных частей`);
        return stations;
    }
    async getById(id) {
        return this.prisma.fireStation.findUnique({ where: { id } });
    }
    async update(id, dto) {
        return this.prisma.fireStation.update({
            where: { id },
            data: {
                name: dto.name,
                address: dto.address,
                latitude: dto.latitude,
                longitude: dto.longitude,
                phoneNumber: dto.phoneNumber,
            },
        });
    }
    async delete(id) {
        return this.prisma.fireStation.delete({ where: { id } });
    }
};
exports.FireStationService = FireStationService;
exports.FireStationService = FireStationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FireStationService);
//# sourceMappingURL=fire-station.service.js.map