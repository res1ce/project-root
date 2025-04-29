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
exports.SystemSettingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SystemSettingsService = class SystemSettingsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSettings() {
        const settings = await this.prisma.systemSettings.findFirst();
        if (!settings) {
            return this.prisma.systemSettings.create({
                data: {
                    defaultCityName: 'Чита',
                    defaultLatitude: 52.0515,
                    defaultLongitude: 113.4712,
                    defaultZoom: 12
                }
            });
        }
        return settings;
    }
    async updateSettings(dto, userId) {
        const existingSettings = await this.getSettings();
        if (!existingSettings) {
            throw new common_1.NotFoundException('Настройки не найдены');
        }
        return this.prisma.systemSettings.update({
            where: { id: existingSettings.id },
            data: {
                defaultCityName: dto.defaultCityName !== undefined ? dto.defaultCityName : undefined,
                defaultLatitude: dto.defaultLatitude !== undefined ? dto.defaultLatitude : undefined,
                defaultLongitude: dto.defaultLongitude !== undefined ? dto.defaultLongitude : undefined,
                defaultZoom: dto.defaultZoom !== undefined ? dto.defaultZoom : undefined,
                updatedById: userId
            },
            include: {
                updatedBy: {
                    select: {
                        id: true,
                        username: true,
                        name: true
                    }
                }
            }
        });
    }
};
exports.SystemSettingsService = SystemSettingsService;
exports.SystemSettingsService = SystemSettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SystemSettingsService);
//# sourceMappingURL=system-settings.service.js.map