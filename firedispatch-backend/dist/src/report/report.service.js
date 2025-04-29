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
var ReportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const fire_events_gateway_1 = require("../fire/fire-events.gateway");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const uuid_1 = require("uuid");
let ReportService = ReportService_1 = class ReportService {
    events;
    prisma;
    logger = new common_1.Logger(ReportService_1.name);
    reportsDir;
    constructor(events, prisma) {
        this.events = events;
        this.prisma = prisma;
        this.reportsDir = path.join(process.cwd(), 'reports');
        if (!fs.existsSync(this.reportsDir)) {
            fs.mkdirSync(this.reportsDir, { recursive: true });
        }
    }
    async create(userId, dto) {
        const report = await this.prisma.report.create({
            data: {
                content: dto.content,
                user: {
                    connect: { id: userId }
                },
                fireIncident: {
                    connect: { id: dto.fireIncidentId }
                }
            },
            include: { user: true }
        });
        this.events.server.emit('reportCreated', report);
        return report;
    }
    async getAll() {
        return this.prisma.report.findMany({ include: { user: true } });
    }
    async getById(id) {
        return this.prisma.report.findUnique({ where: { id }, include: { user: true } });
    }
    async delete(id) {
        return this.prisma.report.delete({ where: { id } });
    }
    async createFireReport(userId, fireIncidentId, content) {
        return this.prisma.report.create({
            data: {
                content,
                user: {
                    connect: { id: userId }
                },
                fireIncident: {
                    connect: { id: fireIncidentId }
                }
            }
        });
    }
    async getFireReports(fireIncidentId) {
        return this.prisma.report.findMany({
            where: {
                fireIncidentId,
            },
            include: {
                user: {
                    select: {
                        name: true,
                        role: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async generateFireIncidentPDF(fireIncidentId) {
        try {
            const fireIncident = await this.prisma.fireIncident.findUnique({
                where: { id: fireIncidentId },
                include: {
                    fireStation: true,
                    reportedBy: {
                        select: { name: true, role: true },
                    },
                    assignedTo: {
                        select: { name: true, role: true },
                    },
                    vehicles: true,
                    reports: {
                        include: {
                            user: {
                                select: { name: true, role: true },
                            },
                        },
                        orderBy: {
                            createdAt: 'desc',
                        },
                    },
                    fireLevel: true,
                },
            });
            if (!fireIncident) {
                throw new Error(`Fire incident with ID ${fireIncidentId} not found`);
            }
            const fileName = `fire_report_${fireIncidentId}_${(0, uuid_1.v4)()}.pdf`;
            const filePath = path.join(this.reportsDir, fileName);
            const doc = new PDFDocument();
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);
            doc.fontSize(25).text('Отчет о пожаре', { align: 'center' });
            doc.moveDown();
            doc.fontSize(14).text(`Номер пожара: ${fireIncident.id}`);
            doc.text(`Дата регистрации: ${fireIncident.createdAt.toLocaleString('ru-RU')}`);
            doc.text(`Статус: ${this.getStatusText(String(fireIncident.status))}`);
            doc.text(`Уровень пожара: ${fireIncident.fireLevel.level}`);
            doc.text(`Координаты: ${fireIncident.latitude}, ${fireIncident.longitude}`);
            if (fireIncident.resolvedAt) {
                doc.text(`Дата разрешения: ${fireIncident.resolvedAt.toLocaleString('ru-RU')}`);
            }
            doc.moveDown();
            doc.fontSize(16).text('Пожарная часть');
            doc.fontSize(12);
            doc.text(`Название: ${fireIncident.fireStation.name}`);
            doc.text(`Адрес: ${fireIncident.fireStation.address}`);
            doc.moveDown();
            doc.fontSize(16).text('Ответственные лица');
            doc.fontSize(12);
            doc.text(`Сообщил о пожаре: ${fireIncident.reportedBy.name} (${fireIncident.reportedBy.role})`);
            doc.text(`Назначен: ${fireIncident.assignedTo.name} (${fireIncident.assignedTo.role})`);
            doc.moveDown();
            doc.fontSize(16).text('Задействованные машины');
            doc.fontSize(12);
            if (fireIncident.vehicles.length === 0) {
                doc.text('Нет задействованных машин');
            }
            else {
                fireIncident.vehicles.forEach((vehicle, index) => {
                    doc.text(`${index + 1}. ${vehicle.model} (${vehicle.type})`);
                });
            }
            doc.moveDown();
            doc.fontSize(16).text('Отчеты');
            doc.fontSize(12);
            if (fireIncident.reports.length === 0) {
                doc.text('Нет отчетов');
            }
            else {
                fireIncident.reports.forEach((report, index) => {
                    doc.text(`Отчет от ${report.createdAt.toLocaleString('ru-RU')}`);
                    doc.text(`Автор: ${report.user.name} (${report.user.role})`);
                    doc.text(`Содержание: ${report.content}`);
                    if (index < fireIncident.reports.length - 1) {
                        doc.moveDown(0.5);
                    }
                });
            }
            doc.end();
            return new Promise((resolve, reject) => {
                stream.on('finish', () => {
                    this.logger.log(`PDF report generated successfully: ${filePath}`);
                    resolve(filePath);
                });
                stream.on('error', (error) => {
                    this.logger.error(`Error generating PDF report: ${error.message}`);
                    reject(error);
                });
            });
        }
        catch (error) {
            this.logger.error(`Failed to generate PDF: ${error.message}`);
            throw error;
        }
    }
    async generateStatisticsReport(startDate, endDate, stationId) {
        try {
            const filter = {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            };
            if (stationId) {
                filter.fireStationId = stationId;
            }
            const fireIncidents = await this.prisma.fireIncident.findMany({
                where: filter,
                include: {
                    fireStation: true,
                    vehicles: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
            const totalIncidents = fireIncidents.length;
            const resolvedIncidents = fireIncidents.filter(incident => incident.status === 'RESOLVED').length;
            const inProgressIncidents = fireIncidents.filter(incident => incident.status === 'IN_PROGRESS').length;
            const pendingIncidents = fireIncidents.filter(incident => incident.status === 'PENDING').length;
            const incidentsByLevel = {};
            const incidentsByStation = {};
            fireIncidents.forEach((incident) => {
                incidentsByLevel[incident.level] = (incidentsByLevel[incident.level] || 0) + 1;
                const stationName = incident.fireStation.name;
                incidentsByStation[stationName] = (incidentsByStation[stationName] || 0) + 1;
            });
            const fileName = `statistics_report_${(0, uuid_1.v4)()}.pdf`;
            const filePath = path.join(this.reportsDir, fileName);
            const doc = new PDFDocument();
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);
            doc.fontSize(25).text('Статистический отчет по пожарам', { align: 'center' });
            doc.fontSize(14).text(`Период: ${startDate.toLocaleDateString('ru-RU')} - ${endDate.toLocaleDateString('ru-RU')}`, { align: 'center' });
            doc.moveDown();
            doc.fontSize(16).text('Общая статистика');
            doc.fontSize(12);
            doc.text(`Всего пожаров: ${totalIncidents}`);
            doc.text(`Разрешенные пожары: ${resolvedIncidents}`);
            doc.text(`В процессе: ${inProgressIncidents}`);
            doc.text(`Ожидающие обработки: ${pendingIncidents}`);
            doc.moveDown();
            doc.fontSize(16).text('Пожары по уровням');
            doc.fontSize(12);
            Object.keys(incidentsByLevel).sort((a, b) => parseInt(a) - parseInt(b)).forEach(level => {
                doc.text(`Уровень ${level}: ${incidentsByLevel[Number(level)]} пожаров`);
            });
            doc.moveDown();
            doc.fontSize(16).text('Пожары по пожарным частям');
            doc.fontSize(12);
            Object.keys(incidentsByStation).forEach(station => {
                doc.text(`${station}: ${incidentsByStation[station]} пожаров`);
            });
            doc.moveDown();
            doc.fontSize(16).text('Список пожаров за период');
            doc.fontSize(12);
            fireIncidents.forEach((incident, index) => {
                doc.text(`${index + 1}. Пожар #${incident.id}`);
                doc.text(`   Дата: ${incident.createdAt.toLocaleString('ru-RU')}`);
                doc.text(`   Статус: ${this.getStatusText(String(incident.status))}`);
                doc.text(`   Уровень: ${incident.level}`);
                doc.text(`   Пожарная часть: ${incident.fireStation.name}`);
                if (index < fireIncidents.length - 1) {
                    doc.moveDown(0.5);
                }
            });
            doc.end();
            return new Promise((resolve, reject) => {
                stream.on('finish', () => {
                    this.logger.log(`Statistics report generated successfully: ${filePath}`);
                    resolve(filePath);
                });
                stream.on('error', (error) => {
                    this.logger.error(`Error generating statistics report: ${error.message}`);
                    reject(error);
                });
            });
        }
        catch (error) {
            this.logger.error(`Failed to generate statistics report: ${error.message}`);
            throw error;
        }
    }
    getStatusText(status) {
        const statusMap = {
            'PENDING': 'Ожидание',
            'IN_PROGRESS': 'В процессе',
            'RESOLVED': 'Разрешено',
            'CANCELLED': 'Отменено'
        };
        return statusMap[status] || status;
    }
};
exports.ReportService = ReportService;
exports.ReportService = ReportService = ReportService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(fire_events_gateway_1.FireEventsGateway)),
    __metadata("design:paramtypes", [fire_events_gateway_1.FireEventsGateway,
        prisma_service_1.PrismaService])
], ReportService);
//# sourceMappingURL=report.service.js.map