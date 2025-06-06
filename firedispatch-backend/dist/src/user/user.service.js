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
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = require("bcryptjs");
const prisma_service_1 = require("../prisma/prisma.service");
let UserService = class UserService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByUsername(username) {
        if (!username)
            throw new Error('username required');
        return this.prisma.user.findFirst({
            where: { username },
            include: { fireStation: true, reports: true },
        });
    }
    async findById(id) {
        return this.prisma.user.findUnique({
            where: { id },
            include: { fireStation: true },
        });
    }
    async createUser(dto) {
        const exists = await this.prisma.user.findFirst({
            where: { username: dto.username },
        });
        if (exists)
            throw new Error('Username already exists');
        const hash = await bcrypt.hash(dto.password, 10);
        return this.prisma.user.create({
            data: {
                username: dto.username,
                password: hash,
                role: dto.role,
                fireStationId: dto.fireStationId,
                name: dto.name || dto.username,
            }
        });
    }
    async countUsers() {
        return this.prisma.user.count();
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserService);
//# sourceMappingURL=user.service.js.map