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
exports.FireEngineController = void 0;
const common_1 = require("@nestjs/common");
const fire_engine_service_1 = require("./fire-engine.service");
const create_fire_engine_dto_1 = require("./dto/create-fire-engine.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
let FireEngineController = class FireEngineController {
    fireEngineService;
    constructor(fireEngineService) {
        this.fireEngineService = fireEngineService;
    }
    async create(dto, req) {
        try {
            if (req.user.role === 'station_dispatcher' && req.user.fireStationId) {
                dto.fireStationId = req.user.fireStationId;
            }
            return await this.fireEngineService.create(dto);
        }
        catch (e) {
            throw new common_1.BadRequestException(e.message);
        }
    }
    async getAll(req) {
        if (req.user.role === 'station_dispatcher' && req.user.fireStationId) {
            return this.fireEngineService.getAllByStation(req.user.fireStationId);
        }
        return this.fireEngineService.getAll();
    }
    getById(id) {
        return this.fireEngineService.getById(Number(id));
    }
    async update(id, dto, req) {
        if (req.user.role === 'station_dispatcher') {
            const engine = await this.fireEngineService.getById(Number(id));
            if (engine && engine.fireStationId !== req.user.fireStationId) {
                throw new common_1.BadRequestException('У вас нет прав на редактирование этой техники');
            }
            dto.fireStationId = req.user.fireStationId;
        }
        return this.fireEngineService.update(Number(id), dto);
    }
    async delete(id, req) {
        if (req.user.role === 'station_dispatcher') {
            const engine = await this.fireEngineService.getById(Number(id));
            if (engine && engine.fireStationId !== req.user.fireStationId) {
                throw new common_1.BadRequestException('У вас нет прав на удаление этой техники');
            }
        }
        return this.fireEngineService.delete(Number(id));
    }
};
exports.FireEngineController = FireEngineController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'station_dispatcher'),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_fire_engine_dto_1.CreateFireEngineDto, Object]),
    __metadata("design:returntype", Promise)
], FireEngineController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FireEngineController.prototype, "getAll", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FireEngineController.prototype, "getById", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'station_dispatcher'),
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_fire_engine_dto_1.CreateFireEngineDto, Object]),
    __metadata("design:returntype", Promise)
], FireEngineController.prototype, "update", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'station_dispatcher'),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FireEngineController.prototype, "delete", null);
exports.FireEngineController = FireEngineController = __decorate([
    (0, common_1.Controller)('fire-engine'),
    __metadata("design:paramtypes", [fire_engine_service_1.FireEngineService])
], FireEngineController);
//# sourceMappingURL=fire-engine.controller.js.map