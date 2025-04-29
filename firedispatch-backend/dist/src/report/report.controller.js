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
exports.ReportController = void 0;
const common_1 = require("@nestjs/common");
const report_service_1 = require("./report.service");
const create_report_dto_1 = require("./dto/create-report.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const fs = require("fs");
const create_fire_report_dto_1 = require("./dto/create-fire-report.dto");
let ReportController = class ReportController {
    reportService;
    constructor(reportService) {
        this.reportService = reportService;
    }
    async create(req, dto) {
        try {
            return await this.reportService.create(req.user.userId, dto);
        }
        catch (e) {
            throw new common_1.BadRequestException(e.message);
        }
    }
    getAll() {
        return this.reportService.getAll();
    }
    getById(id) {
        return this.reportService.getById(Number(id));
    }
    delete(id) {
        return this.reportService.delete(Number(id));
    }
    async createFireReport(req, dto) {
        try {
            return await this.reportService.createFireReport(req.user.userId, dto.fireIncidentId, dto.content);
        }
        catch (e) {
            throw new common_1.BadRequestException(e.message);
        }
    }
    async getFireReports(fireIncidentId) {
        return this.reportService.getFireReports(Number(fireIncidentId));
    }
    async getFireIncidentPdf(fireIncidentId, res) {
        try {
            const pdfPath = await this.reportService.generateFireIncidentPDF(Number(fireIncidentId));
            const filename = pdfPath.split('/').pop();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
            const fileStream = fs.createReadStream(pdfPath);
            fileStream.pipe(res);
            fileStream.on('end', () => {
                fs.unlinkSync(pdfPath);
            });
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
    async getStatisticsPdf(startDateStr, endDateStr, stationIdStr, res) {
        try {
            const startDate = new Date(startDateStr);
            const endDate = new Date(endDateStr);
            const stationId = stationIdStr ? Number(stationIdStr) : undefined;
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                throw new common_1.BadRequestException('Invalid date format');
            }
            const pdfPath = await this.reportService.generateStatisticsReport(startDate, endDate, stationId);
            const filename = pdfPath.split('/').pop();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
            const fileStream = fs.createReadStream(pdfPath);
            fileStream.pipe(res);
            fileStream.on('end', () => {
                fs.unlinkSync(pdfPath);
            });
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
    }
};
exports.ReportController = ReportController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('CENTRAL_DISPATCHER', 'STATION_DISPATCHER'),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_report_dto_1.CreateReportDto]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ReportController.prototype, "getAll", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ReportController.prototype, "getById", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('CENTRAL_DISPATCHER', 'STATION_DISPATCHER'),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ReportController.prototype, "delete", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('CENTRAL_DISPATCHER', 'STATION_DISPATCHER'),
    (0, common_1.Post)('fire-incident'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_fire_report_dto_1.CreateFireReportDto]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "createFireReport", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('fire-incident/:fireIncidentId'),
    __param(0, (0, common_1.Param)('fireIncidentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "getFireReports", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('fire-incident/:fireIncidentId/pdf'),
    __param(0, (0, common_1.Param)('fireIncidentId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "getFireIncidentPdf", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('statistics/pdf'),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('stationId')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "getStatisticsPdf", null);
exports.ReportController = ReportController = __decorate([
    (0, common_1.Controller)('report'),
    __metadata("design:paramtypes", [report_service_1.ReportService])
], ReportController);
//# sourceMappingURL=report.controller.js.map