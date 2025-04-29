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
            },
        });
    }
    async getAll() {
        return this.prisma.fireStation.findMany();
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