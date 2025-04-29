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
exports.FireController = void 0;
const common_1 = require("@nestjs/common");
const fire_service_1 = require("./fire.service");
const create_fire_dto_1 = require("./dto/create-fire.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const change_fire_level_dto_1 = require("./dto/change-fire-level.dto");
const user_activity_service_1 = require("../user/user-activity.service");
const create_firelevel_dto_1 = require("./dto/create-firelevel.dto");
const create_firelevel_requirement_dto_1 = require("./dto/create-firelevel-requirement.dto");
const create_address_level_dto_1 = require("./dto/create-address-level.dto");
let FireController = class FireController {
    fireService;
    userActivityService;
    constructor(fireService, userActivityService) {
        this.fireService = fireService;
        this.userActivityService = userActivityService;
    }
    async create(dto, req) {
        try {
            if (!dto.levelId) {
                dto.levelId = await this.fireService.determineFireLevel(dto.location);
            }
            const result = await this.fireService.create(dto);
            await this.userActivityService.logActivity(req.user.userId, 'create_fire', {
                fireId: result.id,
                location: dto.location,
                levelId: dto.levelId,
                isAutoLevel: !dto.levelId
            }, req);
            return result;
        }
        catch (e) {
            throw new common_1.BadRequestException(e.message);
        }
    }
    getAll() {
        return this.fireService.getAll();
    }
    async getById(id) {
        const numId = Number(id);
        if (!numId || isNaN(numId))
            throw new common_1.BadRequestException('Некорректный id');
        const fire = await this.fireService.getById(numId);
        if (!fire)
            throw new common_1.NotFoundException(`Пожар с id ${id} не найден`);
        return fire;
    }
    async update(id, dto, req) {
        const numId = Number(id);
        if (!numId || isNaN(numId))
            throw new common_1.BadRequestException('Некорректный id');
        const result = await this.fireService.update(numId, dto);
        if (!result)
            throw new common_1.NotFoundException(`Пожар с id ${id} не найден`);
        await this.userActivityService.logActivity(req.user.userId, 'update_fire', { fireId: numId, updates: dto }, req);
        return result;
    }
    delete(id) {
        return this.fireService.delete(Number(id));
    }
    async getAssignments(id) {
        const numId = Number(id);
        if (!numId || isNaN(numId))
            throw new common_1.BadRequestException('Некорректный id');
        const assignments = await this.fireService.getAssignmentsByFireId(numId);
        if (!assignments || assignments.length === 0)
            throw new common_1.NotFoundException(`Назначения для пожара с id ${id} не найдены`);
        return assignments;
    }
    async getFireHistory(id) {
        const numId = Number(id);
        if (!numId || isNaN(numId))
            throw new common_1.BadRequestException('Некорректный id');
        const history = await this.fireService.getFireHistory(numId);
        if (!history || history.length === 0)
            throw new common_1.NotFoundException(`История для пожара с id ${id} не найдена`);
        return history;
    }
    getAllRequirements() {
        return this.fireService.getAllRequirements();
    }
    async getRequirementById(id) {
        const numId = Number(id);
        if (isNaN(numId))
            throw new common_1.BadRequestException('Некорректный id');
        const req = await this.fireService.getRequirementById(numId);
        if (!req)
            throw new common_1.NotFoundException(`Требование с id ${id} не найдено`);
        return req;
    }
    createRequirement(dto) {
        return this.fireService.createRequirement(dto);
    }
    updateRequirement(id, dto) {
        const numId = Number(id);
        if (isNaN(numId))
            throw new common_1.BadRequestException('Некорректный id');
        return this.fireService.updateRequirement(numId, dto);
    }
    deleteRequirement(id) {
        const numId = Number(id);
        if (isNaN(numId))
            throw new common_1.BadRequestException('Некорректный id');
        return this.fireService.deleteRequirement(numId);
    }
    getAllLevels() {
        return this.fireService.getAllLevels();
    }
    async getLevelById(id) {
        const numId = Number(id);
        if (!numId || isNaN(numId))
            throw new common_1.BadRequestException('Некорректный id');
        const level = await this.fireService.getLevelById(numId);
        if (!level)
            throw new common_1.NotFoundException(`Уровень с id ${id} не найден`);
        return level;
    }
    createLevel(dto) {
        return this.fireService.createLevel(dto);
    }
    updateLevel(id, dto) {
        return this.fireService.updateLevel(Number(id), dto);
    }
    deleteLevel(id) {
        return this.fireService.deleteLevel(Number(id));
    }
    async changeFireLevel(id, dto, req) {
        const result = await this.fireService.changeFireLevel(Number(id), dto);
        await this.userActivityService.logActivity(req.user.userId, 'change_fire_level', { fireId: Number(id), newLevelId: dto.newLevel, reason: dto.reason }, req);
        return result;
    }
    getAllAddressLevels() {
        return this.fireService.getAllAddressLevels();
    }
    async getAddressLevelById(id) {
        const numId = Number(id);
        if (isNaN(numId))
            throw new common_1.BadRequestException('Некорректный id');
        return this.fireService.getAddressLevelById(numId);
    }
    createAddressLevel(dto) {
        return this.fireService.createAddressLevel(dto);
    }
    updateAddressLevel(id, dto) {
        return this.fireService.updateAddressLevel(Number(id), dto);
    }
    deleteAddressLevel(id) {
        return this.fireService.deleteAddressLevel(Number(id));
    }
};
exports.FireController = FireController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('central_dispatcher', 'station_dispatcher'),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_fire_dto_1.CreateFireDto, Object]),
    __metadata("design:returntype", Promise)
], FireController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FireController.prototype, "getAll", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FireController.prototype, "getById", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('central_dispatcher', 'station_dispatcher'),
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_fire_dto_1.CreateFireDto, Object]),
    __metadata("design:returntype", Promise)
], FireController.prototype, "update", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('central_dispatcher', 'station_dispatcher'),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FireController.prototype, "delete", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(':id/assignments'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FireController.prototype, "getAssignments", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(':id/history'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FireController.prototype, "getFireHistory", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Get)('/requirement'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FireController.prototype, "getAllRequirements", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Get)('/requirement/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FireController.prototype, "getRequirementById", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Post)('/requirement'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_firelevel_requirement_dto_1.CreateFireLevelRequirementDto]),
    __metadata("design:returntype", void 0)
], FireController.prototype, "createRequirement", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Put)('/requirement/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_firelevel_requirement_dto_1.CreateFireLevelRequirementDto]),
    __metadata("design:returntype", void 0)
], FireController.prototype, "updateRequirement", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Delete)('/requirement/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FireController.prototype, "deleteRequirement", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Get)('/level'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FireController.prototype, "getAllLevels", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Get)('/level/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FireController.prototype, "getLevelById", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Post)('/level'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_firelevel_dto_1.CreateFireLevelDto]),
    __metadata("design:returntype", void 0)
], FireController.prototype, "createLevel", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Put)('/level/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_firelevel_dto_1.CreateFireLevelDto]),
    __metadata("design:returntype", void 0)
], FireController.prototype, "updateLevel", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Delete)('/level/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FireController.prototype, "deleteLevel", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('station_dispatcher'),
    (0, common_1.Put)(':id/level'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, change_fire_level_dto_1.ChangeFireLevelDto, Object]),
    __metadata("design:returntype", Promise)
], FireController.prototype, "changeFireLevel", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Get)('/address-level'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FireController.prototype, "getAllAddressLevels", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Get)('/address-level/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FireController.prototype, "getAddressLevelById", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Post)('/address-level'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_address_level_dto_1.CreateAddressLevelDto]),
    __metadata("design:returntype", void 0)
], FireController.prototype, "createAddressLevel", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Put)('/address-level/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_address_level_dto_1.CreateAddressLevelDto]),
    __metadata("design:returntype", void 0)
], FireController.prototype, "updateAddressLevel", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Delete)('/address-level/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FireController.prototype, "deleteAddressLevel", null);
exports.FireController = FireController = __decorate([
    (0, common_1.Controller)('fire'),
    __metadata("design:paramtypes", [fire_service_1.FireService,
        user_activity_service_1.UserActivityService])
], FireController);
//# sourceMappingURL=fire.controller.js.map