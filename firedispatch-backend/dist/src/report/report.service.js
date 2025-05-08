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
const Excel = require("exceljs");
const fs = require("fs");
const path = require("path");
const uuid_1 = require("uuid");
const client_1 = require("@prisma/client");
const pdf_generator_1 = require("../utils/pdf-generator");
let ReportService = ReportService_1 = class ReportService {
    events;
    prisma;
    logger = new common_1.Logger(ReportService_1.name);
    reportsDir;
    pdfGenerator;
    constructor(events, prisma) {
        this.events = events;
        this.prisma = prisma;
        this.reportsDir = path.join(process.cwd(), 'reports');
        if (!fs.existsSync(this.reportsDir)) {
            fs.mkdirSync(this.reportsDir, { recursive: true });
        }
        this.pdfGenerator = new pdf_generator_1.PdfGenerator();
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
            const fireIncidentData = await this.prisma.fireIncident.findUnique({
                where: { id: fireIncidentId },
                include: {
                    fireStation: true,
                    reportedBy: {
                        select: { id: true, name: true, role: true },
                    },
                    assignedTo: {
                        select: { id: true, name: true, role: true },
                    },
                    vehicles: {
                        include: {}
                    },
                    reports: {
                        include: {
                            user: {
                                select: { id: true, name: true, role: true },
                            },
                        },
                        orderBy: {
                            createdAt: 'desc',
                        },
                    },
                    fireLevel: true,
                },
            });
            if (!fireIncidentData) {
                throw new Error(`Fire incident with ID ${fireIncidentId} not found`);
            }
            const fireIncident = fireIncidentData;
            const fileName = `fire_report_${fireIncidentId}_${(0, uuid_1.v4)()}.pdf`;
            const filePath = path.join(this.reportsDir, fileName);
            const content = [
                {
                    text: 'Отчет о пожаре',
                    style: 'header',
                    alignment: 'center'
                },
                {
                    text: `№${fireIncidentId} от ${fireIncident.createdAt.toLocaleDateString('ru-RU')}`,
                    style: 'subheader',
                    alignment: 'center',
                    margin: [0, 0, 0, 20]
                },
                {
                    text: 'Общая информация',
                    style: 'sectionHeader'
                },
                {
                    style: 'table',
                    table: {
                        widths: ['30%', '70%'],
                        body: [
                            ['Номер пожара:', `${fireIncident.id}`],
                            ['Дата регистрации:', `${fireIncident.createdAt.toLocaleString('ru-RU')}`],
                            ['Статус:', this.getStatusText(String(fireIncident.status))],
                            ['Уровень пожара:', `${fireIncident.fireLevel ? `${fireIncident.fireLevel.level} - ${fireIncident.fireLevel.description || 'Без описания'}` : 'Неизвестно'}`],
                            ['Координаты:', `${fireIncident.latitude}, ${fireIncident.longitude}`],
                            ['Адрес происшествия:', `${fireIncident.address || 'Не указан'}`],
                            ['Описание происшествия:', `${fireIncident.description || 'Не указано'}`]
                        ]
                    },
                    layout: 'lightHorizontalLines'
                }
            ];
            if (fireIncident.resolvedAt) {
                content.push({
                    style: 'table',
                    table: {
                        widths: ['30%', '70%'],
                        body: [
                            ['Дата разрешения:', `${fireIncident.resolvedAt.toLocaleString('ru-RU')}`],
                            ['Длительность инцидента:', (() => {
                                    const duration = Math.floor((fireIncident.resolvedAt.getTime() - fireIncident.createdAt.getTime()) / (1000 * 60));
                                    return `${duration} минут (${Math.floor(duration / 60)} ч. ${duration % 60} мин.)`;
                                })()]
                        ]
                    },
                    layout: 'lightHorizontalLines'
                });
            }
            content.push({ text: '', margin: [0, 10, 0, 10] });
            content.push({
                text: 'Пожарная часть',
                style: 'sectionHeader'
            }, {
                style: 'table',
                table: {
                    widths: ['30%', '70%'],
                    body: [
                        ['Название:', `${fireIncident.fireStation.name}`],
                        ['Адрес:', `${fireIncident.fireStation.address}`],
                        ['Телефон:', `${fireIncident.fireStation.phoneNumber || 'Не указан'}`],
                        ['Координаты:', `${fireIncident.fireStation.latitude}, ${fireIncident.fireStation.longitude}`],
                        ['Расстояние до пожара:', this.calculateDistance(fireIncident.latitude, fireIncident.longitude, fireIncident.fireStation.latitude, fireIncident.fireStation.longitude) + ' км']
                    ]
                },
                layout: 'lightHorizontalLines'
            });
            content.push({ text: '', margin: [0, 10, 0, 10] });
            content.push({
                text: 'Ответственные лица',
                style: 'sectionHeader'
            }, {
                style: 'table',
                table: {
                    widths: ['30%', '70%'],
                    body: [
                        ['Сообщил о пожаре:', `${fireIncident.reportedBy.name} (${fireIncident.reportedBy.role})`],
                        ['Назначен:', `${fireIncident.assignedTo.name} (${fireIncident.assignedTo.role})`]
                    ]
                },
                layout: 'lightHorizontalLines'
            });
            content.push({ text: '', margin: [0, 10, 0, 10] });
            content.push({
                text: 'Задействованные машины',
                style: 'sectionHeader'
            });
            if (fireIncident.vehicles.length === 0) {
                content.push({ text: 'Нет задействованных машин', margin: [0, 5, 0, 5] });
            }
            else {
                content.push({
                    style: 'table',
                    table: {
                        headerRows: 1,
                        widths: ['auto', '*', 'auto', 'auto', 'auto'],
                        body: [
                            [{ text: '№', style: 'tableHeader' },
                                { text: 'Модель', style: 'tableHeader' },
                                { text: 'Тип', style: 'tableHeader' },
                                { text: 'Рег. номер', style: 'tableHeader' },
                                { text: 'Экипаж', style: 'tableHeader' }],
                            ...fireIncident.vehicles.map((vehicle, index) => {
                                let crewInfo = 'Нет информации';
                                if (vehicle.crew && vehicle.crew.length > 0) {
                                    crewInfo = `${vehicle.crew.length} чел.`;
                                }
                                return [
                                    (index + 1).toString(),
                                    vehicle.model,
                                    vehicle.engineType?.name || vehicle.type || 'Не указан',
                                    vehicle.registrationNumber || 'Не указан',
                                    crewInfo
                                ];
                            })
                        ]
                    }
                });
            }
            const vehiclesWithCrew = fireIncident.vehicles.filter((vehicle) => vehicle.crew && vehicle.crew.length > 0);
            for (const vehicle of vehiclesWithCrew) {
                content.push({
                    text: `Экипаж машины ${vehicle.model}:`,
                    style: 'subheader',
                    margin: [0, 10, 0, 5]
                });
                content.push({
                    ul: vehicle.crew.map((member, index) => `${index + 1}. ${member.name} (${member.role || 'Должность не указана'})`),
                    margin: [20, 0, 0, 10]
                });
            }
            content.push({ text: '', margin: [0, 10, 0, 10] });
            content.push({
                text: 'Отчеты',
                style: 'sectionHeader'
            });
            if (fireIncident.reports.length === 0) {
                content.push({ text: 'Нет отчетов', margin: [0, 5, 0, 5] });
            }
            else {
                for (let i = 0; i < fireIncident.reports.length; i++) {
                    const report = fireIncident.reports[i];
                    content.push({
                        text: `Отчет #${i + 1} от ${report.createdAt.toLocaleString('ru-RU')}`,
                        style: 'reportHeader',
                        margin: [0, 10, 0, 5]
                    });
                    content.push({
                        text: `Автор: ${report.user.name} (${report.user.role})`,
                        style: 'small',
                        margin: [0, 0, 0, 5]
                    });
                    content.push({
                        text: 'Содержание:',
                        style: 'contentHeader',
                        margin: [0, 0, 0, 5]
                    });
                    content.push({
                        text: report.content,
                        style: 'content',
                        margin: [0, 0, 0, 15]
                    });
                    if (i < fireIncident.reports.length - 1) {
                        content.push({
                            canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#cccccc' }]
                        });
                    }
                }
            }
            const documentDefinition = {
                info: {
                    title: `Отчет о пожаре #${fireIncidentId}`,
                    author: 'Fire Dispatch System',
                    subject: 'Отчет о пожарном происшествии',
                    keywords: 'пожар, отчет, мчс',
                },
                pageSize: 'A4',
                pageMargins: [40, 60, 40, 60],
                content: content,
                styles: {
                    header: {
                        fontSize: 24,
                        bold: true,
                        color: '#1E3A8A',
                        margin: [0, 0, 0, 10]
                    },
                    subheader: {
                        fontSize: 16,
                        color: '#475569',
                        margin: [0, 5, 0, 5]
                    },
                    sectionHeader: {
                        fontSize: 18,
                        bold: true,
                        color: '#0F172A',
                        decoration: 'underline',
                        margin: [0, 15, 0, 10]
                    },
                    tableHeader: {
                        bold: true,
                        fontSize: 12,
                        color: '#1E3A8A',
                        fillColor: '#F1F5F9'
                    },
                    table: {
                        margin: [0, 5, 0, 15]
                    },
                    reportHeader: {
                        fontSize: 14,
                        bold: true,
                        color: '#1E3A8A'
                    },
                    contentHeader: {
                        fontSize: 12,
                        bold: true,
                        decoration: 'underline'
                    },
                    content: {
                        fontSize: 12,
                        alignment: 'justify'
                    },
                    small: {
                        fontSize: 10,
                        color: '#475569'
                    }
                },
                footer: (currentPage, pageCount) => ({
                    text: `Страница ${currentPage} из ${pageCount}`,
                    alignment: 'center',
                    fontSize: 8,
                    margin: [0, 10, 0, 0]
                })
            };
            return await this.pdfGenerator.createPdf(documentDefinition, filePath);
        }
        catch (error) {
            this.logger.error(`Failed to generate PDF: ${error.message}`);
            throw error;
        }
    }
    async generateFireIncidentExcel(fireIncidentId) {
        try {
            const fireIncidentData = await this.prisma.fireIncident.findUnique({
                where: { id: fireIncidentId },
                include: {
                    fireStation: true,
                    reportedBy: {
                        select: { name: true, role: true },
                    },
                    assignedTo: {
                        select: { name: true, role: true },
                    },
                    vehicles: {
                        include: {}
                    },
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
            if (!fireIncidentData) {
                throw new Error(`Fire incident with ID ${fireIncidentId} not found`);
            }
            const fireIncident = fireIncidentData;
            const fileName = `fire_report_${fireIncidentId}_${(0, uuid_1.v4)()}.xlsx`;
            const filePath = path.join(this.reportsDir, fileName);
            const workbook = new Excel.Workbook();
            workbook.creator = 'Fire Dispatch System';
            workbook.lastModifiedBy = 'Fire Dispatch System';
            workbook.created = new Date();
            workbook.modified = new Date();
            const infoSheet = workbook.addWorksheet('Основная информация');
            const titleStyle = {
                font: { bold: true, size: 16 },
                alignment: { horizontal: 'center' }
            };
            const headerStyle = {
                font: { bold: true },
                fill: {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFD3D3D3' }
                },
                border: {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                }
            };
            const titleRow = infoSheet.addRow(['Отчет о пожаре №' + fireIncidentId]);
            titleRow.font = { bold: true, size: 16 };
            infoSheet.mergeCells('A1:B1');
            infoSheet.addRow([]);
            infoSheet.columns = [
                { header: 'Параметр', key: 'parameter', width: 30, style: {
                        font: { bold: true },
                        fill: {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFD3D3D3' }
                        },
                        border: {
                            top: { style: 'thin' },
                            left: { style: 'thin' },
                            bottom: { style: 'thin' },
                            right: { style: 'thin' }
                        }
                    } },
                { header: 'Значение', key: 'value', width: 50 }
            ];
            infoSheet.getRow(3).eachCell(cell => {
                cell.font = { bold: true };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFD3D3D3' }
                };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
            const infoRows = [
                { parameter: 'Номер пожара', value: fireIncident.id },
                { parameter: 'Дата регистрации', value: fireIncident.createdAt.toLocaleString('ru-RU') },
                { parameter: 'Статус', value: this.getStatusText(String(fireIncident.status)) },
                { parameter: 'Уровень пожара', value: fireIncident.fireLevel?.level || 'Неизвестно' },
                { parameter: 'Координаты', value: `${fireIncident.latitude}, ${fireIncident.longitude}` },
                { parameter: 'Адрес происшествия', value: fireIncident.address || 'Не указан' },
                { parameter: 'Описание происшествия', value: fireIncident.description || 'Не указано' }
            ];
            if (fireIncident.resolvedAt) {
                infoRows.push({ parameter: 'Дата разрешения', value: fireIncident.resolvedAt.toLocaleString('ru-RU') });
                const duration = Math.floor((fireIncident.resolvedAt.getTime() - fireIncident.createdAt.getTime()) / (1000 * 60));
                infoRows.push({ parameter: 'Длительность инцидента', value: `${duration} минут (${Math.floor(duration / 60)} ч. ${duration % 60} мин.)` });
            }
            infoRows.push({ parameter: 'Пожарная часть', value: fireIncident.fireStation?.name || 'Неизвестно' });
            infoRows.push({ parameter: 'Адрес пожарной части', value: fireIncident.fireStation?.address || 'Неизвестно' });
            if (fireIncident.fireStation?.latitude && fireIncident.fireStation?.longitude) {
                const distance = this.calculateDistance(fireIncident.latitude, fireIncident.longitude, fireIncident.fireStation.latitude, fireIncident.fireStation.longitude);
                infoRows.push({ parameter: 'Расстояние до пожара', value: `${distance} км` });
            }
            infoRows.push({ parameter: 'Сообщил о пожаре', value: `${fireIncident.reportedBy?.name || 'Неизвестно'} (${fireIncident.reportedBy?.role || 'Неизвестно'})` });
            infoRows.push({ parameter: 'Назначен', value: `${fireIncident.assignedTo?.name || 'Неизвестно'} (${fireIncident.assignedTo?.role || 'Неизвестно'})` });
            infoRows.forEach(row => {
                infoSheet.addRow(row);
            });
            infoSheet.eachRow((row, rowIndex) => {
                if (rowIndex >= 3) {
                    row.eachCell((cell, colIndex) => {
                        cell.border = {
                            top: { style: 'thin' },
                            left: { style: 'thin' },
                            bottom: { style: 'thin' },
                            right: { style: 'thin' }
                        };
                        if (rowIndex % 2 === 0) {
                            cell.fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'FFFAFAFA' }
                            };
                        }
                        if (colIndex === 1) {
                            cell.font = { bold: true };
                        }
                    });
                }
            });
            if (fireIncident.vehicles && fireIncident.vehicles.length > 0) {
                const vehiclesSheet = workbook.addWorksheet('Машины');
                vehiclesSheet.columns = [
                    { header: '№', key: 'number', width: 10 },
                    { header: 'Модель', key: 'model', width: 30 },
                    { header: 'Тип', key: 'type', width: 20 },
                    { header: 'Рег. номер', key: 'regNumber', width: 20 },
                    { header: 'Экипаж', key: 'crew', width: 15 }
                ];
                vehiclesSheet.getRow(1).eachCell(cell => {
                    cell.font = { bold: true };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFD3D3D3' }
                    };
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });
                fireIncident.vehicles.forEach((vehicle, index) => {
                    let crewInfo = 'Нет информации';
                    if (vehicle.crew && vehicle.crew.length > 0) {
                        crewInfo = `${vehicle.crew.length} чел.`;
                    }
                    vehiclesSheet.addRow({
                        number: index + 1,
                        model: vehicle.model || 'Не указано',
                        type: vehicle.engineType?.name || vehicle.type || 'Не указан',
                        regNumber: vehicle.registrationNumber || 'Не указан',
                        crew: crewInfo
                    });
                });
                vehiclesSheet.eachRow((row, rowIndex) => {
                    if (rowIndex > 1) {
                        row.eachCell(cell => {
                            cell.border = {
                                top: { style: 'thin' },
                                left: { style: 'thin' },
                                bottom: { style: 'thin' },
                                right: { style: 'thin' }
                            };
                            if (rowIndex % 2 === 0) {
                                cell.fill = {
                                    type: 'pattern',
                                    pattern: 'solid',
                                    fgColor: { argb: 'FFFAFAFA' }
                                };
                            }
                        });
                    }
                });
                if (fireIncident.vehicles.some(v => v.crew && v.crew.length > 0)) {
                    const crewSheet = workbook.addWorksheet('Экипаж');
                    crewSheet.columns = [
                        { header: 'Машина', key: 'vehicle', width: 30 },
                        { header: 'Сотрудник', key: 'name', width: 40 },
                        { header: 'Должность', key: 'role', width: 30 }
                    ];
                    crewSheet.getRow(1).eachCell(cell => {
                        cell.font = { bold: true };
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFD3D3D3' }
                        };
                        cell.border = {
                            top: { style: 'thin' },
                            left: { style: 'thin' },
                            bottom: { style: 'thin' },
                            right: { style: 'thin' }
                        };
                    });
                    let rowIndex = 2;
                    fireIncident.vehicles.forEach(vehicle => {
                        if (vehicle.crew && vehicle.crew.length > 0) {
                            vehicle.crew.forEach(member => {
                                crewSheet.addRow({
                                    vehicle: `${vehicle.model} (${vehicle.registrationNumber || 'Номер не указан'})`,
                                    name: member.name || 'Не указано',
                                    role: member.role || 'Не указано'
                                });
                                rowIndex++;
                            });
                        }
                    });
                    crewSheet.eachRow((row, index) => {
                        if (index > 1) {
                            row.eachCell(cell => {
                                cell.border = {
                                    top: { style: 'thin' },
                                    left: { style: 'thin' },
                                    bottom: { style: 'thin' },
                                    right: { style: 'thin' }
                                };
                                if (index % 2 === 0) {
                                    cell.fill = {
                                        type: 'pattern',
                                        pattern: 'solid',
                                        fgColor: { argb: 'FFFAFAFA' }
                                    };
                                }
                            });
                        }
                    });
                }
            }
            if (fireIncident.reports && fireIncident.reports.length > 0) {
                const reportsSheet = workbook.addWorksheet('Отчеты');
                reportsSheet.columns = [
                    { header: '№', key: 'number', width: 10 },
                    { header: 'Дата', key: 'date', width: 20 },
                    { header: 'Автор', key: 'author', width: 30 },
                    { header: 'Содержание', key: 'content', width: 60 }
                ];
                reportsSheet.getRow(1).eachCell(cell => {
                    cell.font = { bold: true };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFD3D3D3' }
                    };
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });
                fireIncident.reports.forEach((report, index) => {
                    reportsSheet.addRow({
                        number: index + 1,
                        date: report.createdAt.toLocaleString('ru-RU'),
                        author: `${report.user.name} (${report.user.role})`,
                        content: report.content
                    });
                });
                reportsSheet.eachRow((row, rowIndex) => {
                    if (rowIndex > 1) {
                        row.height = 30;
                        row.eachCell(cell => {
                            cell.border = {
                                top: { style: 'thin' },
                                left: { style: 'thin' },
                                bottom: { style: 'thin' },
                                right: { style: 'thin' }
                            };
                            cell.alignment = { wrapText: true, vertical: 'top' };
                            if (rowIndex % 2 === 0) {
                                cell.fill = {
                                    type: 'pattern',
                                    pattern: 'solid',
                                    fgColor: { argb: 'FFFAFAFA' }
                                };
                            }
                        });
                    }
                });
            }
            const metaSheet = workbook.addWorksheet('Служебная информация');
            metaSheet.columns = [
                { header: 'Параметр', key: 'parameter', width: 30 },
                { header: 'Значение', key: 'value', width: 50 }
            ];
            metaSheet.getRow(1).eachCell(cell => {
                cell.font = { bold: true };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFD3D3D3' }
                };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
            metaSheet.addRow({ parameter: 'Отчет сгенерирован', value: new Date().toLocaleString('ru-RU') });
            metaSheet.addRow({ parameter: 'Идентификатор отчета', value: (0, uuid_1.v4)() });
            metaSheet.addRow({ parameter: 'Версия системы', value: 'Система формирования отчетов МЧС v1.0' });
            metaSheet.eachRow((row, rowIndex) => {
                if (rowIndex > 1) {
                    row.eachCell(cell => {
                        cell.border = {
                            top: { style: 'thin' },
                            left: { style: 'thin' },
                            bottom: { style: 'thin' },
                            right: { style: 'thin' }
                        };
                    });
                }
            });
            await workbook.xlsx.writeFile(filePath);
            this.logger.log(`Excel report generated successfully: ${filePath}`);
            return filePath;
        }
        catch (error) {
            this.logger.error(`Failed to generate Excel: ${error.message}`);
            throw error;
        }
    }
    async generateStatisticsReport(startDate, endDate, stationId) {
        try {
            this.logger.log(`Начало генерации статистического отчета PDF: ${startDate} - ${endDate}, stationId: ${stationId}`);
            const filter = {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            };
            if (stationId) {
                filter.fireStationId = stationId;
            }
            this.logger.log(`Запрос пожаров с фильтром: ${JSON.stringify(filter)}`);
            const fireIncidentsData = await this.prisma.fireIncident.findMany({
                where: filter,
                include: {
                    fireStation: true,
                    vehicles: true,
                    reportedBy: true,
                    assignedTo: true,
                    fireLevel: true,
                    reports: {
                        include: {
                            user: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
            this.logger.log(`[PDF] Получено ${fireIncidentsData.length} пожаров`);
            this.logger.log(`[PDF] Пожары: ${JSON.stringify(fireIncidentsData.map(incident => ({
                id: incident.id,
                status: incident.status,
                created: incident.createdAt,
                station: incident.fireStation?.name || 'Unknown'
            })))}`);
            const fireIncidents = fireIncidentsData;
            const totalIncidents = fireIncidents.length;
            const resolvedIncidents = fireIncidents.filter(incident => incident.status === client_1.IncidentStatus.RESOLVED).length;
            const inProgressIncidents = fireIncidents.filter(incident => incident.status === client_1.IncidentStatus.IN_PROGRESS).length;
            const pendingIncidents = fireIncidents.filter(incident => incident.status === client_1.IncidentStatus.PENDING).length;
            const cancelledIncidents = fireIncidents.filter(incident => incident.status === client_1.IncidentStatus.CANCELLED).length;
            const incidentsByLevel = {};
            const incidentsByStation = {};
            let totalResolutionTime = 0;
            let resolvedCount = 0;
            let totalVehiclesUsed = 0;
            const vehiclesByType = {};
            const addressFrequency = {};
            fireIncidents.forEach((incident) => {
                const levelNum = incident.fireLevel ? incident.fireLevel.level : 'Неизвестный';
                incidentsByLevel[String(levelNum)] = (incidentsByLevel[String(levelNum)] || 0) + 1;
                const stationName = incident.fireStation ? incident.fireStation.name : 'Неизвестно';
                incidentsByStation[stationName] = (incidentsByStation[stationName] || 0) + 1;
                if (incident.status === client_1.IncidentStatus.RESOLVED && incident.resolvedAt) {
                    const resolutionTimeMinutes = Math.floor((incident.resolvedAt.getTime() - incident.createdAt.getTime()) / (1000 * 60));
                    totalResolutionTime += resolutionTimeMinutes;
                    resolvedCount++;
                }
                if (incident.vehicles && incident.vehicles.length > 0) {
                    totalVehiclesUsed += incident.vehicles.length;
                    incident.vehicles.forEach((vehicle) => {
                        const vehicleType = vehicle.type || 'Неизвестный';
                        vehiclesByType[vehicleType] = (vehiclesByType[vehicleType] || 0) + 1;
                    });
                }
                if (incident.address) {
                    addressFrequency[incident.address] = (addressFrequency[incident.address] || 0) + 1;
                }
            });
            const averageResolutionTime = resolvedCount > 0 ?
                Math.floor(totalResolutionTime / resolvedCount) : 0;
            const topAddresses = Object.entries(addressFrequency)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);
            const fileName = `statistics_report_${(0, uuid_1.v4)()}.pdf`;
            const filePath = path.join(this.reportsDir, fileName);
            let stationInfo = '';
            if (stationId) {
                const station = await this.prisma.fireStation.findUnique({ where: { id: stationId } });
                if (station) {
                    stationInfo = station.name;
                }
            }
            const content = [
                {
                    text: 'Статистический отчет по пожарам',
                    style: 'header',
                    alignment: 'center'
                },
                {
                    text: `Период: ${startDate.toLocaleDateString('ru-RU')} - ${endDate.toLocaleDateString('ru-RU')}`,
                    style: 'subheader',
                    alignment: 'center'
                }
            ];
            if (stationInfo) {
                content.push({
                    text: `Пожарная часть: ${stationInfo}`,
                    style: 'subheader',
                    alignment: 'center',
                    margin: [0, 0, 0, 20]
                });
            }
            else {
                content.push({ text: '', margin: [0, 0, 0, 20] });
            }
            content.push({
                text: 'Общая статистика',
                style: 'sectionHeader'
            });
            content.push({
                style: 'table',
                table: {
                    widths: ['40%', '60%'],
                    body: [
                        ['Всего пожаров', totalIncidents.toString()],
                        ['Разрешенных пожаров', resolvedIncidents.toString()],
                        ['В процессе', inProgressIncidents.toString()],
                        ['Ожидающих', pendingIncidents.toString()],
                        ['Отмененных', cancelledIncidents.toString()],
                        ['Среднее время разрешения', `${averageResolutionTime} мин (${Math.floor(averageResolutionTime / 60)}ч ${averageResolutionTime % 60}м)`],
                        ['Всего использовано машин', totalVehiclesUsed.toString()]
                    ]
                },
                layout: 'lightHorizontalLines'
            });
            content.push({ text: '', margin: [0, 10, 0, 10] });
            content.push({
                text: 'Пожары по уровням',
                style: 'sectionHeader'
            });
            if (Object.keys(incidentsByLevel).length > 0) {
                const levelRows = Object.keys(incidentsByLevel)
                    .sort((a, b) => {
                    const numA = parseInt(a);
                    const numB = parseInt(b);
                    if (!isNaN(numA) && !isNaN(numB))
                        return numA - numB;
                    return a.localeCompare(b);
                })
                    .map(level => [
                    level,
                    incidentsByLevel[level].toString(),
                    `${((incidentsByLevel[level] / totalIncidents) * 100).toFixed(1)}%`
                ]);
                content.push({
                    style: 'table',
                    table: {
                        headerRows: 1,
                        widths: ['20%', '20%', '20%'],
                        body: [
                            [
                                { text: 'Уровень', style: 'tableHeader' },
                                { text: 'Количество', style: 'tableHeader' },
                                { text: 'Процент', style: 'tableHeader' }
                            ],
                            ...levelRows
                        ]
                    }
                });
            }
            else {
                content.push({ text: 'Нет данных по уровням пожаров', alignment: 'center' });
            }
            content.push({ text: '', margin: [0, 10, 0, 10] });
            content.push({
                text: 'Пожары по пожарным частям',
                style: 'sectionHeader'
            });
            if (Object.keys(incidentsByStation).length > 0) {
                const stationRows = Object.keys(incidentsByStation)
                    .sort()
                    .map(station => [
                    station,
                    incidentsByStation[station].toString(),
                    `${((incidentsByStation[station] / totalIncidents) * 100).toFixed(1)}%`
                ]);
                content.push({
                    style: 'table',
                    table: {
                        headerRows: 1,
                        widths: ['50%', '20%', '30%'],
                        body: [
                            [
                                { text: 'Пожарная часть', style: 'tableHeader' },
                                { text: 'Количество', style: 'tableHeader' },
                                { text: 'Процент', style: 'tableHeader' }
                            ],
                            ...stationRows
                        ]
                    }
                });
            }
            else {
                content.push({ text: 'Нет данных по пожарным частям', alignment: 'center' });
            }
            content.push({ text: '', margin: [0, 10, 0, 10] });
            content.push({
                text: 'Машины по типам',
                style: 'sectionHeader'
            });
            if (Object.keys(vehiclesByType).length > 0) {
                const vehicleRows = Object.keys(vehiclesByType)
                    .sort()
                    .map(type => [
                    type,
                    vehiclesByType[type].toString()
                ]);
                content.push({
                    style: 'table',
                    table: {
                        headerRows: 1,
                        widths: ['70%', '30%'],
                        body: [
                            [
                                { text: 'Тип машины', style: 'tableHeader' },
                                { text: 'Количество', style: 'tableHeader' }
                            ],
                            ...vehicleRows
                        ]
                    }
                });
            }
            else {
                content.push({ text: 'Нет данных по машинам', alignment: 'center' });
            }
            content.push({ text: '', margin: [0, 10, 0, 10] });
            if (topAddresses.length > 0) {
                content.push({
                    text: 'Наиболее частые адреса пожаров',
                    style: 'sectionHeader'
                });
                const addressRows = topAddresses.map(([address, count]) => [
                    address,
                    count.toString()
                ]);
                content.push({
                    style: 'table',
                    table: {
                        headerRows: 1,
                        widths: ['70%', '30%'],
                        body: [
                            [
                                { text: 'Адрес', style: 'tableHeader' },
                                { text: 'Количество происшествий', style: 'tableHeader' }
                            ],
                            ...addressRows
                        ]
                    }
                });
                content.push({ text: '', margin: [0, 10, 0, 10] });
            }
            content.push({
                text: 'Список пожаров',
                style: 'sectionHeader'
            });
            if (fireIncidents.length > 0) {
                const incidentRows = fireIncidents
                    .map((incident, index) => [
                    (index + 1).toString(),
                    incident.id.toString(),
                    incident.createdAt.toLocaleString('ru-RU'),
                    this.getStatusText(String(incident.status)),
                    incident.fireLevel ? incident.fireLevel.level.toString() : 'Неизвестно',
                    incident.fireStation ? incident.fireStation.name : 'Неизвестно'
                ]);
                content.push({
                    style: 'table',
                    table: {
                        headerRows: 1,
                        widths: ['auto', 'auto', 'auto', 'auto', 'auto', '*'],
                        body: [
                            [
                                { text: '№', style: 'tableHeader' },
                                { text: 'ID', style: 'tableHeader' },
                                { text: 'Дата', style: 'tableHeader' },
                                { text: 'Статус', style: 'tableHeader' },
                                { text: 'Уровень', style: 'tableHeader' },
                                { text: 'Пожарная часть', style: 'tableHeader' }
                            ],
                            ...incidentRows
                        ]
                    }
                });
            }
            else {
                content.push({ text: 'Нет данных о пожарах за указанный период', alignment: 'center' });
            }
            content.push({ text: '', pageBreak: 'before' }, {
                text: 'Служебная информация',
                style: 'sectionHeader'
            }, {
                fontSize: 10,
                stack: [
                    `Отчет сгенерирован: ${new Date().toLocaleString('ru-RU')}`,
                    `Идентификатор отчета: ${(0, uuid_1.v4)()}`,
                    'Система диспетчеризации МЧС v1.0'
                ]
            });
            const documentDefinition = {
                info: {
                    title: 'Статистический отчет',
                    author: 'Система диспетчеризации МЧС',
                    subject: 'Статистика пожаров',
                    keywords: 'пожар, отчет, статистика',
                },
                pageSize: 'A4',
                pageMargins: [40, 60, 40, 60],
                content: content,
                styles: {
                    header: {
                        fontSize: 24,
                        bold: true,
                        color: '#1E3A8A',
                        margin: [0, 0, 0, 10]
                    },
                    subheader: {
                        fontSize: 16,
                        color: '#475569',
                        margin: [0, 5, 0, 5]
                    },
                    sectionHeader: {
                        fontSize: 18,
                        bold: true,
                        color: '#0F172A',
                        decoration: 'underline',
                        margin: [0, 15, 0, 10]
                    },
                    tableHeader: {
                        bold: true,
                        fontSize: 12,
                        color: '#1E3A8A',
                        fillColor: '#F1F5F9'
                    },
                    table: {
                        margin: [0, 5, 0, 15]
                    }
                },
                footer: (currentPage, pageCount) => ({
                    text: `Страница ${currentPage} из ${pageCount}`,
                    alignment: 'center',
                    fontSize: 8,
                    margin: [0, 10, 0, 0]
                })
            };
            return await this.pdfGenerator.createPdf(documentDefinition, filePath);
        }
        catch (error) {
            this.logger.error(`Critical error generating report: ${error.message}`);
            this.logger.error(error.stack);
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
    getStatusInEnglish(status) {
        const statusMap = {
            'PENDING': 'Pending',
            'IN_PROGRESS': 'In Progress',
            'RESOLVED': 'Resolved',
            'CANCELLED': 'Cancelled'
        };
        return statusMap[status] || status;
    }
    drawTable(doc, data, x, y, options = {}) {
        const { headers, rows } = data;
        const maxRows = options.maxRows || rows.length;
        const limitedRows = rows.slice(0, maxRows);
        const pageWidth = doc.page.width - 2 * x;
        const colWidth = pageWidth / headers.length;
        const headerFillColor = '#E2E8F0';
        const borderColor = '#94A3B8';
        const textColor = '#0F172A';
        const alternateRowColor = '#F8FAFC';
        let currentY = y;
        doc.font('Helvetica');
        doc.fillColor(headerFillColor);
        doc.rect(x, currentY, pageWidth, 25).fill();
        doc.fillColor(textColor);
        headers.forEach((header, i) => {
            doc.font('Helvetica-Bold').fontSize(10).text(header, x + i * colWidth + 5, currentY + 7, { width: colWidth - 10, align: 'left' });
        });
        currentY += 25;
        doc.strokeColor(borderColor);
        doc.moveTo(x, currentY).lineTo(x + pageWidth, currentY).stroke();
        limitedRows.forEach((row, rowIndex) => {
            if (rowIndex % 2 === 1) {
                doc.fillColor(alternateRowColor);
                doc.rect(x, currentY, pageWidth, 20).fill();
                doc.fillColor(textColor);
            }
            row.forEach((cell, colIndex) => {
                const font = colIndex === 0 ? 'Helvetica-Bold' : 'Helvetica';
                doc.font(font).fontSize(9).text(cell, x + colIndex * colWidth + 5, currentY + 5, { width: colWidth - 10, align: 'left' });
            });
            currentY += 20;
            doc.strokeColor(borderColor);
            doc.moveTo(x, currentY).lineTo(x + pageWidth, currentY).stroke();
            if (currentY > doc.page.height - 70) {
                doc.addPage();
                currentY = 50;
                doc.fillColor(headerFillColor);
                doc.rect(x, currentY, pageWidth, 25).fill();
                doc.fillColor(textColor);
                headers.forEach((header, i) => {
                    doc.font('Helvetica-Bold').fontSize(10).text(header, x + i * colWidth + 5, currentY + 7, { width: colWidth - 10, align: 'left' });
                });
                currentY += 25;
                doc.strokeColor(borderColor);
                doc.moveTo(x, currentY).lineTo(x + pageWidth, currentY).stroke();
            }
        });
        for (let i = 0; i <= headers.length; i++) {
            doc.moveTo(x + i * colWidth, y).lineTo(x + i * colWidth, currentY).stroke();
        }
        doc.y = currentY + 10;
    }
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance.toFixed(2);
    }
    deg2rad(deg) {
        return deg * (Math.PI / 180);
    }
    async generateStatisticsExcel(startDate, endDate, stationId) {
        try {
            this.logger.log(`Начало генерации статистического отчета Excel: ${startDate} - ${endDate}, stationId: ${stationId}`);
            const filter = {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            };
            if (stationId) {
                filter.fireStationId = stationId;
            }
            this.logger.log(`Запрос пожаров с фильтром: ${JSON.stringify(filter)}`);
            const fireIncidentsData = await this.prisma.fireIncident.findMany({
                where: filter,
                include: {
                    fireStation: true,
                    vehicles: true,
                    reportedBy: true,
                    assignedTo: true,
                    fireLevel: true,
                    reports: {
                        include: {
                            user: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
            this.logger.log(`[Excel] Получено ${fireIncidentsData.length} пожаров для Excel отчета`);
            this.logger.log(`[Excel] Пожары: ${JSON.stringify(fireIncidentsData.map(incident => ({
                id: incident.id,
                status: incident.status,
                created: incident.createdAt,
                station: incident.fireStation?.name || 'Unknown'
            })))}`);
            const fireIncidents = fireIncidentsData;
            const totalIncidents = fireIncidents.length;
            const resolvedIncidents = fireIncidents.filter(incident => incident.status === client_1.IncidentStatus.RESOLVED).length;
            const inProgressIncidents = fireIncidents.filter(incident => incident.status === client_1.IncidentStatus.IN_PROGRESS).length;
            const pendingIncidents = fireIncidents.filter(incident => incident.status === client_1.IncidentStatus.PENDING).length;
            const cancelledIncidents = fireIncidents.filter(incident => incident.status === client_1.IncidentStatus.CANCELLED).length;
            const incidentsByLevel = {};
            const incidentsByStation = {};
            let totalResolutionTime = 0;
            let resolvedCount = 0;
            let totalVehiclesUsed = 0;
            const vehiclesByType = {};
            const addressFrequency = {};
            fireIncidents.forEach((incident) => {
                const levelNum = incident.fireLevel ? incident.fireLevel.level : 'Неизвестный';
                incidentsByLevel[String(levelNum)] = (incidentsByLevel[String(levelNum)] || 0) + 1;
                const stationName = incident.fireStation ? incident.fireStation.name : 'Неизвестно';
                incidentsByStation[stationName] = (incidentsByStation[stationName] || 0) + 1;
                if (incident.status === client_1.IncidentStatus.RESOLVED && incident.resolvedAt) {
                    const resolutionTimeMinutes = Math.floor((incident.resolvedAt.getTime() - incident.createdAt.getTime()) / (1000 * 60));
                    totalResolutionTime += resolutionTimeMinutes;
                    resolvedCount++;
                }
                if (incident.vehicles && incident.vehicles.length > 0) {
                    totalVehiclesUsed += incident.vehicles.length;
                    incident.vehicles.forEach((vehicle) => {
                        const vehicleType = vehicle.type || 'Неизвестный';
                        vehiclesByType[vehicleType] = (vehiclesByType[vehicleType] || 0) + 1;
                    });
                }
                if (incident.address) {
                    addressFrequency[incident.address] = (addressFrequency[incident.address] || 0) + 1;
                }
            });
            const averageResolutionTime = resolvedCount > 0 ?
                Math.floor(totalResolutionTime / resolvedCount) : 0;
            const topAddresses = Object.entries(addressFrequency)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);
            const fileName = `statistics_report_${(0, uuid_1.v4)()}.xlsx`;
            const filePath = path.join(this.reportsDir, fileName);
            let stationInfo = '';
            if (stationId) {
                const station = await this.prisma.fireStation.findUnique({ where: { id: stationId } });
                if (station) {
                    stationInfo = station.name;
                }
            }
            const workbook = new Excel.Workbook();
            workbook.creator = 'Система диспетчеризации МЧС';
            workbook.lastModifiedBy = 'Система диспетчеризации МЧС';
            workbook.created = new Date();
            workbook.modified = new Date();
            const statsSheet = workbook.addWorksheet('Общая статистика');
            const titleRow = statsSheet.addRow(['Статистический отчет по пожарам']);
            titleRow.font = { bold: true, size: 16 };
            statsSheet.mergeCells('A1:B1');
            titleRow.alignment = { horizontal: 'center' };
            const periodRow = statsSheet.addRow([`Период: ${startDate.toLocaleDateString('ru-RU')} - ${endDate.toLocaleDateString('ru-RU')}`]);
            statsSheet.mergeCells('A2:B2');
            periodRow.alignment = { horizontal: 'center' };
            if (stationInfo) {
                const stationRow = statsSheet.addRow([`Пожарная часть: ${stationInfo}`]);
                statsSheet.mergeCells('A3:B3');
                stationRow.alignment = { horizontal: 'center' };
                statsSheet.addRow([]);
            }
            else {
                statsSheet.addRow([]);
            }
            statsSheet.columns = [
                { header: 'Параметр', key: 'parameter', width: 30 },
                { header: 'Значение', key: 'value', width: 40 }
            ];
            if (!statsSheet.getRow(1).getCell(1).value) {
                statsSheet.getRow(1).values = ['Параметр', 'Значение'];
            }
            const headerRow = statsSheet.getRow(1);
            headerRow.eachCell(cell => {
                cell.font = { bold: true };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFD3D3D3' }
                };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
            const statsRows = [
                { parameter: 'Всего пожаров', value: totalIncidents },
                { parameter: 'Разрешенных пожаров', value: resolvedIncidents },
                { parameter: 'В процессе', value: inProgressIncidents },
                { parameter: 'Ожидающих', value: pendingIncidents },
                { parameter: 'Отмененных', value: cancelledIncidents },
                { parameter: 'Среднее время разрешения', value: `${averageResolutionTime} мин (${Math.floor(averageResolutionTime / 60)}ч ${averageResolutionTime % 60}м)` },
                { parameter: 'Всего использовано машин', value: totalVehiclesUsed }
            ];
            statsRows.forEach(row => {
                statsSheet.addRow(row);
            });
            statsSheet.eachRow((row, rowIndex) => {
                if (rowIndex > 1) {
                    row.eachCell((cell, colIndex) => {
                        cell.border = {
                            top: { style: 'thin' },
                            left: { style: 'thin' },
                            bottom: { style: 'thin' },
                            right: { style: 'thin' }
                        };
                        if (rowIndex % 2 === 0) {
                            cell.fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'FFFAFAFA' }
                            };
                        }
                    });
                }
            });
            if (Object.keys(incidentsByLevel).length > 0) {
                const levelsSheet = workbook.addWorksheet('Уровни пожаров');
                levelsSheet.columns = [
                    { header: 'Уровень', key: 'level', width: 20 },
                    { header: 'Количество', key: 'count', width: 20 },
                    { header: 'Процент', key: 'percent', width: 20 }
                ];
                const levelsHeaderRow = levelsSheet.getRow(1);
                levelsHeaderRow.eachCell(cell => {
                    cell.font = { bold: true };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFD3D3D3' }
                    };
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });
                Object.keys(incidentsByLevel)
                    .sort((a, b) => {
                    const numA = parseInt(a);
                    const numB = parseInt(b);
                    if (!isNaN(numA) && !isNaN(numB))
                        return numA - numB;
                    return a.localeCompare(b);
                })
                    .forEach((level, index) => {
                    const count = incidentsByLevel[level];
                    const percent = ((count / totalIncidents) * 100).toFixed(1) + '%';
                    levelsSheet.addRow({
                        level,
                        count,
                        percent
                    });
                });
                levelsSheet.eachRow((row, rowIndex) => {
                    if (rowIndex > 1) {
                        row.eachCell(cell => {
                            cell.border = {
                                top: { style: 'thin' },
                                left: { style: 'thin' },
                                bottom: { style: 'thin' },
                                right: { style: 'thin' }
                            };
                            if (rowIndex % 2 === 0) {
                                cell.fill = {
                                    type: 'pattern',
                                    pattern: 'solid',
                                    fgColor: { argb: 'FFFAFAFA' }
                                };
                            }
                        });
                    }
                });
            }
            if (Object.keys(incidentsByStation).length > 0) {
                const stationsSheet = workbook.addWorksheet('Пожарные части');
                stationsSheet.columns = [
                    { header: 'Пожарная часть', key: 'station', width: 40 },
                    { header: 'Количество', key: 'count', width: 20 },
                    { header: 'Процент', key: 'percent', width: 20 }
                ];
                const stationsHeaderRow = stationsSheet.getRow(1);
                stationsHeaderRow.eachCell(cell => {
                    cell.font = { bold: true };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFD3D3D3' }
                    };
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });
                Object.keys(incidentsByStation)
                    .sort()
                    .forEach((station, index) => {
                    const count = incidentsByStation[station];
                    const percent = ((count / totalIncidents) * 100).toFixed(1) + '%';
                    stationsSheet.addRow({
                        station,
                        count,
                        percent
                    });
                });
                stationsSheet.eachRow((row, rowIndex) => {
                    if (rowIndex > 1) {
                        row.eachCell(cell => {
                            cell.border = {
                                top: { style: 'thin' },
                                left: { style: 'thin' },
                                bottom: { style: 'thin' },
                                right: { style: 'thin' }
                            };
                            if (rowIndex % 2 === 0) {
                                cell.fill = {
                                    type: 'pattern',
                                    pattern: 'solid',
                                    fgColor: { argb: 'FFFAFAFA' }
                                };
                            }
                        });
                    }
                });
            }
            if (Object.keys(vehiclesByType).length > 0) {
                const vehiclesSheet = workbook.addWorksheet('Машины');
                vehiclesSheet.columns = [
                    { header: 'Тип машины', key: 'type', width: 40 },
                    { header: 'Количество', key: 'count', width: 20 }
                ];
                const vehiclesHeaderRow = vehiclesSheet.getRow(1);
                vehiclesHeaderRow.eachCell(cell => {
                    cell.font = { bold: true };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFD3D3D3' }
                    };
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });
                Object.keys(vehiclesByType)
                    .sort()
                    .forEach((type, index) => {
                    vehiclesSheet.addRow({
                        type,
                        count: vehiclesByType[type]
                    });
                });
                vehiclesSheet.eachRow((row, rowIndex) => {
                    if (rowIndex > 1) {
                        row.eachCell(cell => {
                            cell.border = {
                                top: { style: 'thin' },
                                left: { style: 'thin' },
                                bottom: { style: 'thin' },
                                right: { style: 'thin' }
                            };
                            if (rowIndex % 2 === 0) {
                                cell.fill = {
                                    type: 'pattern',
                                    pattern: 'solid',
                                    fgColor: { argb: 'FFFAFAFA' }
                                };
                            }
                        });
                    }
                });
            }
            if (topAddresses.length > 0) {
                const addressesSheet = workbook.addWorksheet('Проблемные адреса');
                addressesSheet.columns = [
                    { header: 'Адрес', key: 'address', width: 50 },
                    { header: 'Количество происшествий', key: 'count', width: 30 }
                ];
                const addressesHeaderRow = addressesSheet.getRow(1);
                addressesHeaderRow.eachCell(cell => {
                    cell.font = { bold: true };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFD3D3D3' }
                    };
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });
                topAddresses.forEach(([address, count], index) => {
                    addressesSheet.addRow({
                        address,
                        count
                    });
                });
                addressesSheet.eachRow((row, rowIndex) => {
                    if (rowIndex > 1) {
                        row.eachCell(cell => {
                            cell.border = {
                                top: { style: 'thin' },
                                left: { style: 'thin' },
                                bottom: { style: 'thin' },
                                right: { style: 'thin' }
                            };
                            if (rowIndex % 2 === 0) {
                                cell.fill = {
                                    type: 'pattern',
                                    pattern: 'solid',
                                    fgColor: { argb: 'FFFAFAFA' }
                                };
                            }
                        });
                    }
                });
            }
            const incidentsSheet = workbook.addWorksheet('Все пожары');
            incidentsSheet.columns = [
                { header: '№', key: 'num', width: 10 },
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Дата', key: 'date', width: 20 },
                { header: 'Статус', key: 'status', width: 15 },
                { header: 'Уровень', key: 'level', width: 10 },
                { header: 'Пожарная часть', key: 'station', width: 40 },
                { header: 'Адрес', key: 'address', width: 40 }
            ];
            const incidentsHeaderRow = incidentsSheet.getRow(1);
            incidentsHeaderRow.eachCell(cell => {
                cell.font = { bold: true };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFD3D3D3' }
                };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
            fireIncidents.forEach((incident, index) => {
                incidentsSheet.addRow({
                    num: index + 1,
                    id: incident.id,
                    date: incident.createdAt.toLocaleString('ru-RU'),
                    status: this.getStatusText(String(incident.status)),
                    level: incident.fireLevel ? incident.fireLevel.level : 'Неизвестно',
                    station: incident.fireStation ? incident.fireStation.name : 'Неизвестно',
                    address: incident.address || 'Не указан'
                });
            });
            incidentsSheet.eachRow((row, rowIndex) => {
                if (rowIndex > 1) {
                    row.eachCell(cell => {
                        cell.border = {
                            top: { style: 'thin' },
                            left: { style: 'thin' },
                            bottom: { style: 'thin' },
                            right: { style: 'thin' }
                        };
                        if (rowIndex % 2 === 0) {
                            cell.fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'FFFAFAFA' }
                            };
                        }
                    });
                }
            });
            const metaSheet = workbook.addWorksheet('Служебная информация');
            metaSheet.columns = [
                { header: 'Параметр', key: 'parameter', width: 30 },
                { header: 'Значение', key: 'value', width: 50 }
            ];
            const metaHeaderRow = metaSheet.getRow(1);
            metaHeaderRow.eachCell(cell => {
                cell.font = { bold: true };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFD3D3D3' }
                };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
            metaSheet.addRow({ parameter: 'Отчет сгенерирован', value: new Date().toLocaleString('ru-RU') });
            metaSheet.addRow({ parameter: 'Идентификатор отчета', value: (0, uuid_1.v4)() });
            metaSheet.addRow({ parameter: 'Версия системы', value: 'Система формирования отчетов МЧС v1.0' });
            metaSheet.eachRow((row, rowIndex) => {
                if (rowIndex > 1) {
                    row.eachCell(cell => {
                        cell.border = {
                            top: { style: 'thin' },
                            left: { style: 'thin' },
                            bottom: { style: 'thin' },
                            right: { style: 'thin' }
                        };
                    });
                }
            });
            await workbook.xlsx.writeFile(filePath);
            this.logger.log(`Excel отчет со статистикой успешно создан: ${filePath}`);
            return filePath;
        }
        catch (error) {
            this.logger.error(`Ошибка при создании Excel отчета: ${error.message}`);
            this.logger.error(error.stack);
            throw error;
        }
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