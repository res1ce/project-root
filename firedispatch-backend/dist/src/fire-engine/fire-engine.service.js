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
exports.FireEngineService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let FireEngineService = class FireEngineService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        return this.prisma.vehicle.create({
            data: {
                model: dto.model,
                type: dto.type,
                fireStation: {
                    connect: { id: dto.fireStationId }
                }
            }
        });
    }
    async getAll() {
        return this.prisma.vehicle.findMany({
            include: {
                fireStation: true
            }
        });
    }
    async getAllByStation(stationId) {
        return this.prisma.vehicle.findMany({
            where: {
                fireStationId: stationId
            },
            include: {
                fireStation: true
            }
        });
    }
    async getById(id) {
        return this.prisma.vehicle.findUnique({
            where: { id },
            include: {
                fireStation: true
            }
        });
    }
    async update(id, dto) {
        return this.prisma.vehicle.update({
            where: { id },
            data: {
                model: dto.model,
                type: dto.type,
                status: dto.status,
                fireStation: dto.fireStationId ? {
                    connect: { id: dto.fireStationId }
                } : undefined
            }
        });
    }
    async delete(id) {
        return this.prisma.vehicle.delete({ where: { id } });
    }
};
exports.FireEngineService = FireEngineService;
exports.FireEngineService = FireEngineService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FireEngineService);
//# sourceMappingURL=fire-engine.service.js.map