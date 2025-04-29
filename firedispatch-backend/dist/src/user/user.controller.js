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
exports.UserController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const create_user_dto_1 = require("./dto/create-user.dto");
const user_service_1 = require("./user.service");
const user_activity_service_1 = require("./user-activity.service");
let UserController = class UserController {
    userService;
    userActivityService;
    constructor(userService, userActivityService) {
        this.userService = userService;
        this.userActivityService = userActivityService;
    }
    getMe(req) {
        return req.user;
    }
    adminOnly(req) {
        return { message: 'Only for admin', user: req.user };
    }
    async createUser(dto, req) {
        try {
            const result = await this.userService.createUser(dto);
            await this.userActivityService.logActivity(req.user.userId, 'create_user', { username: dto.username, role: dto.role, fireStationId: dto.fireStationId }, req);
            return result;
        }
        catch (e) {
            throw new common_1.BadRequestException(e.message);
        }
    }
    async getUserActivities(userId, action, limit) {
        return this.userActivityService.getUserActivities(userId ? Number(userId) : undefined, action, limit ? Number(limit) : 100);
    }
    async getUserActivityById(id) {
        return this.userActivityService.getUserActivities(Number(id));
    }
    async getActivityStats() {
        try {
            const activities = await this.userActivityService.getUserActivities();
            const stats = activities.reduce((acc, activity) => {
                const action = activity.action;
                acc[action] = (acc[action] || 0) + 1;
                return acc;
            }, {});
            const totalUsers = await this.userService.countUsers();
            const today = new Date();
            const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const activityToday = activities.filter((a) => new Date(a.timestamp) >= startOfToday).length;
            return {
                stats,
                totalUsers,
                activityToday,
                totalActivity: activities.length
            };
        }
        catch (e) {
            throw new common_1.BadRequestException(e.message);
        }
    }
};
exports.UserController = UserController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "getMe", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Get)('admin-only'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "adminOnly", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "createUser", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Get)('activity'),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Query)('action')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getUserActivities", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'central_dispatcher'),
    (0, common_1.Get)(':id/activity'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getUserActivityById", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Get)('activity/stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getActivityStats", null);
exports.UserController = UserController = __decorate([
    (0, common_1.Controller)('user'),
    __metadata("design:paramtypes", [user_service_1.UserService,
        user_activity_service_1.UserActivityService])
], UserController);
//# sourceMappingURL=user.controller.js.map