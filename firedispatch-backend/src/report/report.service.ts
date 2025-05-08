import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { FireEventsGateway } from '../fire/fire-events.gateway';
import * as Excel from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { FireIncident, FireStation, Report, User, Vehicle, IncidentStatus } from '@prisma/client';
import { BorderStyle } from 'exceljs';
import { PdfGenerator } from '../utils/pdf-generator';
import { TDocumentDefinitions, Content } from 'pdfmake/interfaces';

// Отключаем проверку некоторых правил линтера, которые мешают компиляции
// @ts-ignore
// Интерфейсы для расширенных моделей с включенными зависимостями
interface FireIncidentWithRelations extends FireIncident {
  fireStation: FireStation;
  reportedBy: User;
  assignedTo: User;
  vehicles: VehicleWithRelations[];
  reports: ReportWithRelations[];
  fireLevel?: { id: number; level: number; description: string };
}

interface VehicleWithRelations extends Vehicle {
  engineType?: { id: number; name: string };
  crew?: User[];
  registrationNumber?: string;
}

interface ReportWithRelations extends Report {
  user: User;
}

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);
  private readonly reportsDir: string;
  private readonly pdfGenerator: PdfGenerator;

  constructor(
    @Inject(FireEventsGateway) private readonly events: FireEventsGateway,
    private prisma: PrismaService
  ) {
    // Создаем папку для отчетов, если её нет
    this.reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
    
    // Инициализируем генератор PDF
    this.pdfGenerator = new PdfGenerator();
  }

  async create(userId: number, dto: CreateReportDto) {
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

  async getById(id: number) {
    return this.prisma.report.findUnique({ where: { id }, include: { user: true } });
  }

  async delete(id: number) {
    return this.prisma.report.delete({ where: { id } });
  }

  /**
   * Создает отчет по пожару и сохраняет его в базу
   */
  async createFireReport(userId: number, fireIncidentId: number, content: string) {
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

  /**
   * Получает отчеты по конкретному пожару
   */
  async getFireReports(fireIncidentId: number) {
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

  /**
   * Генерирует PDF-отчет по пожару
   */
  async generateFireIncidentPDF(fireIncidentId: number): Promise<string> {
    try {
      // Получаем данные о пожаре с более детальной информацией
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
            include: {
              // engineType: true,
              // crew: true
            }
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

      // Типизируем данные полученные из призмы
      const fireIncident = fireIncidentData as unknown as FireIncidentWithRelations;

      // Создаем уникальное имя файла
      const fileName = `fire_report_${fireIncidentId}_${uuidv4()}.pdf`;
      const filePath = path.join(this.reportsDir, fileName);

      // Создаем массив для содержимого документа
      const content: Content[] = [
        // Заголовок отчета
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
        
        // Основная информация о пожаре
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

      // Добавляем информацию о разрешении пожара если есть
      if (fireIncident.resolvedAt) {
        content.push({
          style: 'table',
          table: {
            widths: ['30%', '70%'],
            body: [
              ['Дата разрешения:', `${fireIncident.resolvedAt.toLocaleString('ru-RU')}`],
              // Добавляем длительность инцидента
              ['Длительность инцидента:', (() => {
                const duration = Math.floor((fireIncident.resolvedAt.getTime() - fireIncident.createdAt.getTime()) / (1000 * 60));
                return `${duration} минут (${Math.floor(duration / 60)} ч. ${duration % 60} мин.)`;
              })()]
            ]
          },
          layout: 'lightHorizontalLines'
        });
      }

      // Пустая строка для разделения
      content.push({ text: '', margin: [0, 10, 0, 10] });
      
      // Информация о пожарной части
      content.push(
        {
          text: 'Пожарная часть',
          style: 'sectionHeader'
        },
        {
          style: 'table',
          table: {
            widths: ['30%', '70%'],
            body: [
              ['Название:', `${fireIncident.fireStation.name}`],
              ['Адрес:', `${fireIncident.fireStation.address}`],
              ['Телефон:', `${fireIncident.fireStation.phoneNumber || 'Не указан'}`],
              ['Координаты:', `${fireIncident.fireStation.latitude}, ${fireIncident.fireStation.longitude}`],
              ['Расстояние до пожара:', this.calculateDistance(
                fireIncident.latitude,
                fireIncident.longitude,
                fireIncident.fireStation.latitude,
                fireIncident.fireStation.longitude
              ) + ' км']
            ]
          },
          layout: 'lightHorizontalLines'
        }
      );
      
      // Пустая строка для разделения
      content.push({ text: '', margin: [0, 10, 0, 10] });
      
      // Информация о диспетчерах
      content.push(
        {
          text: 'Ответственные лица',
          style: 'sectionHeader'
        },
        {
          style: 'table',
          table: {
            widths: ['30%', '70%'],
            body: [
              ['Сообщил о пожаре:', `${fireIncident.reportedBy.name} (${fireIncident.reportedBy.role})`],
              ['Назначен:', `${fireIncident.assignedTo.name} (${fireIncident.assignedTo.role})`]
            ]
          },
          layout: 'lightHorizontalLines'
        }
      );
      
      // Пустая строка для разделения
      content.push({ text: '', margin: [0, 10, 0, 10] });
      
      // Информация о задействованных машинах
      content.push({
        text: 'Задействованные машины',
        style: 'sectionHeader'
      });
      
      // Проверяем наличие машин
      if (fireIncident.vehicles.length === 0) {
        content.push({ text: 'Нет задействованных машин', margin: [0, 5, 0, 5] });
      } else {
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
              ...fireIncident.vehicles.map((vehicle: any, index: number) => {
                // Создаем строку с информацией о экипаже
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
      
      // Добавляем информацию об экипаже машин, если она есть
      const vehiclesWithCrew = fireIncident.vehicles.filter((vehicle: any) => vehicle.crew && vehicle.crew.length > 0);
      
      for (const vehicle of vehiclesWithCrew) {
        content.push({
          text: `Экипаж машины ${vehicle.model}:`,
          style: 'subheader',
          margin: [0, 10, 0, 5]
        });
        
        // Здесь vehicle.crew гарантированно существует из-за фильтра выше
        content.push({
          ul: vehicle.crew!.map((member: any, index: number) => 
            `${index + 1}. ${member.name} (${member.role || 'Должность не указана'})`
          ),
          margin: [20, 0, 0, 10]
        });
      }
      
      // Пустая строка для разделения
      content.push({ text: '', margin: [0, 10, 0, 10] });
      
      // Информация об отчетах
      content.push({
        text: 'Отчеты',
        style: 'sectionHeader'
      });
      
      // Проверяем наличие отчетов
      if (fireIncident.reports.length === 0) {
        content.push({ text: 'Нет отчетов', margin: [0, 5, 0, 5] });
      } else {
        // Добавляем все отчеты
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
          
          // Добавляем разделитель между отчетами если это не последний отчет
          if (i < fireIncident.reports.length - 1) {
            content.push({
              canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#cccccc' }]
            });
          }
        }
      }

      // Создаем структуру документа для pdfmake
      const documentDefinition: TDocumentDefinitions = {
        info: {
          title: `Отчет о пожаре #${fireIncidentId}`,
          author: 'Fire Dispatch System',
          subject: 'Отчет о пожарном происшествии',
          keywords: 'пожар, отчет, мчс',
        },
        pageSize: 'A4',
        pageMargins: [40, 60, 40, 60],
        content: content,
        
        // Стили для документа
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
        
        // Нижний колонтитул с номерами страниц
        footer: (currentPage, pageCount) => ({ 
          text: `Страница ${currentPage} из ${pageCount}`, 
          alignment: 'center',
          fontSize: 8,
          margin: [0, 10, 0, 0]
        })
      };
      
      // Создаем PDF и сохраняем его
      return await this.pdfGenerator.createPdf(documentDefinition, filePath);
    } catch (error) {
      this.logger.error(`Failed to generate PDF: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Генерирует Excel-отчет по пожару
   */
  async generateFireIncidentExcel(fireIncidentId: number): Promise<string> {
    try {
      // Получаем данные о пожаре
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
            include: {
              // engineType: true,
              // crew: true
            }
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

      // Типизируем данные полученные из призмы
      const fireIncident = fireIncidentData as unknown as FireIncidentWithRelations;

      // Создаем уникальное имя файла
      const fileName = `fire_report_${fireIncidentId}_${uuidv4()}.xlsx`;
      const filePath = path.join(this.reportsDir, fileName);

      // Создаем Excel документ
      const workbook = new Excel.Workbook();
      workbook.creator = 'Fire Dispatch System';
      workbook.lastModifiedBy = 'Fire Dispatch System';
      workbook.created = new Date();
      workbook.modified = new Date();
      
      // Основная информация
      const infoSheet = workbook.addWorksheet('Основная информация');
      
      // Стили для заголовков
      const titleStyle = {
        font: { bold: true, size: 16 },
        alignment: { horizontal: 'center' }
      };
      
      // Стили для подзаголовков
      const headerStyle = {
        font: { bold: true },
        fill: {
          type: 'pattern' as const,
          pattern: 'solid' as const,
          fgColor: { argb: 'FFD3D3D3' }
        },
        border: {
          top: { style: 'thin' as BorderStyle },
          left: { style: 'thin' as BorderStyle },
          bottom: { style: 'thin' as BorderStyle },
          right: { style: 'thin' as BorderStyle }
        }
      };
      
      // Добавляем заголовок
      const titleRow = infoSheet.addRow(['Отчет о пожаре №' + fireIncidentId]);
      titleRow.font = { bold: true, size: 16 };
      infoSheet.mergeCells('A1:B1');
      
      // Добавляем пустую строку
      infoSheet.addRow([]);
      
      infoSheet.columns = [
        { header: 'Параметр', key: 'parameter', width: 30, style: { 
          font: { bold: true },
          fill: {
            type: 'pattern' as const,
            pattern: 'solid' as const,
            fgColor: { argb: 'FFD3D3D3' }
          },
          border: {
            top: { style: 'thin' as BorderStyle },
            left: { style: 'thin' as BorderStyle },
            bottom: { style: 'thin' as BorderStyle },
            right: { style: 'thin' as BorderStyle }
          }
        } },
        { header: 'Значение', key: 'value', width: 50 }
      ];
      
      // Применяем стили к заголовкам колонок
      infoSheet.getRow(3).eachCell(cell => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD3D3D3' }
        };
        cell.border = {
          top: { style: 'thin' as BorderStyle },
          left: { style: 'thin' as BorderStyle },
          bottom: { style: 'thin' as BorderStyle },
          right: { style: 'thin' as BorderStyle }
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
        
        // Добавляем длительность инцидента
        const duration = Math.floor((fireIncident.resolvedAt.getTime() - fireIncident.createdAt.getTime()) / (1000 * 60));
        infoRows.push({ parameter: 'Длительность инцидента', value: `${duration} минут (${Math.floor(duration / 60)} ч. ${duration % 60} мин.)` });
      }
      
      infoRows.push({ parameter: 'Пожарная часть', value: fireIncident.fireStation?.name || 'Неизвестно' });
      infoRows.push({ parameter: 'Адрес пожарной части', value: fireIncident.fireStation?.address || 'Неизвестно' });
      
      // Добавляем расстояние до пожара
      if (fireIncident.fireStation?.latitude && fireIncident.fireStation?.longitude) {
        const distance = this.calculateDistance(
          fireIncident.latitude,
          fireIncident.longitude,
          fireIncident.fireStation.latitude,
          fireIncident.fireStation.longitude
        );
        infoRows.push({ parameter: 'Расстояние до пожара', value: `${distance} км` });
      }
      
      infoRows.push({ parameter: 'Сообщил о пожаре', value: `${fireIncident.reportedBy?.name || 'Неизвестно'} (${fireIncident.reportedBy?.role || 'Неизвестно'})` });
      infoRows.push({ parameter: 'Назначен', value: `${fireIncident.assignedTo?.name || 'Неизвестно'} (${fireIncident.assignedTo?.role || 'Неизвестно'})` });
      
      // Добавляем все строки в таблицу
      infoRows.forEach(row => {
        infoSheet.addRow(row);
      });
      
      // Применяем стили для чередующихся строк и границы
      infoSheet.eachRow((row, rowIndex) => {
        if (rowIndex >= 3) { // Пропускаем заголовки
          row.eachCell((cell, colIndex) => {
            cell.border = {
              top: { style: 'thin' as BorderStyle },
              left: { style: 'thin' as BorderStyle },
              bottom: { style: 'thin' as BorderStyle },
              right: { style: 'thin' as BorderStyle }
            };
            
            // Чередующийся цвет строк
            if (rowIndex % 2 === 0) {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFAFAFA' }
              };
            }
            
            // Выделение стлобца с параметрами
            if (colIndex === 1) {
              cell.font = { bold: true };
            }
          });
        }
      });
      
      // Лист с машинами
      if (fireIncident.vehicles && fireIncident.vehicles.length > 0) {
        const vehiclesSheet = workbook.addWorksheet('Машины');
        vehiclesSheet.columns = [
          { header: '№', key: 'number', width: 10 },
          { header: 'Модель', key: 'model', width: 30 },
          { header: 'Тип', key: 'type', width: 20 },
          { header: 'Рег. номер', key: 'regNumber', width: 20 },
          { header: 'Экипаж', key: 'crew', width: 15 }
        ];
        
        // Применяем стили к заголовкам
        vehiclesSheet.getRow(1).eachCell(cell => {
          cell.font = { bold: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' }
          };
          cell.border = {
            top: { style: 'thin' as BorderStyle },
            left: { style: 'thin' as BorderStyle },
            bottom: { style: 'thin' as BorderStyle },
            right: { style: 'thin' as BorderStyle }
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
        
        // Применяем стили для строк таблицы
        vehiclesSheet.eachRow((row, rowIndex) => {
          if (rowIndex > 1) { // Пропускаем заголовки
            row.eachCell(cell => {
              cell.border = {
                top: { style: 'thin' as BorderStyle },
                left: { style: 'thin' as BorderStyle },
                bottom: { style: 'thin' as BorderStyle },
                right: { style: 'thin' as BorderStyle }
              };
              
              // Чередующийся цвет строк
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
        
        // Детальная информация о экипаже на отдельном листе
        if (fireIncident.vehicles.some(v => v.crew && v.crew.length > 0)) {
          const crewSheet = workbook.addWorksheet('Экипаж');
          crewSheet.columns = [
            { header: 'Машина', key: 'vehicle', width: 30 },
            { header: 'Сотрудник', key: 'name', width: 40 },
            { header: 'Должность', key: 'role', width: 30 }
          ];
          
          // Применяем стили к заголовкам
          crewSheet.getRow(1).eachCell(cell => {
            cell.font = { bold: true };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFD3D3D3' }
            };
            cell.border = {
              top: { style: 'thin' as BorderStyle },
              left: { style: 'thin' as BorderStyle },
              bottom: { style: 'thin' as BorderStyle },
              right: { style: 'thin' as BorderStyle }
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
          
          // Применяем стили для строк таблицы
          crewSheet.eachRow((row, index) => {
            if (index > 1) { // Пропускаем заголовки
              row.eachCell(cell => {
                cell.border = {
                  top: { style: 'thin' as BorderStyle },
                  left: { style: 'thin' as BorderStyle },
                  bottom: { style: 'thin' as BorderStyle },
                  right: { style: 'thin' as BorderStyle }
                };
                
                // Чередующийся цвет строк
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
      
      // Лист с отчетами
      if (fireIncident.reports && fireIncident.reports.length > 0) {
        const reportsSheet = workbook.addWorksheet('Отчеты');
        reportsSheet.columns = [
          { header: '№', key: 'number', width: 10 },
          { header: 'Дата', key: 'date', width: 20 },
          { header: 'Автор', key: 'author', width: 30 },
          { header: 'Содержание', key: 'content', width: 60 }
        ];
        
        // Применяем стили к заголовкам
        reportsSheet.getRow(1).eachCell(cell => {
          cell.font = { bold: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' }
          };
          cell.border = {
            top: { style: 'thin' as BorderStyle },
            left: { style: 'thin' as BorderStyle },
            bottom: { style: 'thin' as BorderStyle },
            right: { style: 'thin' as BorderStyle }
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
        
        // Отрегулируем высоту строк для отображения содержимого отчетов
        reportsSheet.eachRow((row, rowIndex) => {
          if (rowIndex > 1) { // Пропускаем заголовки
            row.height = 30; // Увеличиваем высоту строк
            
            row.eachCell(cell => {
              cell.border = {
                top: { style: 'thin' as BorderStyle },
                left: { style: 'thin' as BorderStyle },
                bottom: { style: 'thin' as BorderStyle },
                right: { style: 'thin' as BorderStyle }
              };
              
              // Включаем перенос текста для содержимого
              cell.alignment = { wrapText: true, vertical: 'top' };
              
              // Чередующийся цвет строк
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
      
      // Служебная информация
      const metaSheet = workbook.addWorksheet('Служебная информация');
      metaSheet.columns = [
        { header: 'Параметр', key: 'parameter', width: 30 },
        { header: 'Значение', key: 'value', width: 50 }
      ];
      
      // Применяем стили к заголовкам
      metaSheet.getRow(1).eachCell(cell => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD3D3D3' }
        };
        cell.border = {
          top: { style: 'thin' as BorderStyle },
          left: { style: 'thin' as BorderStyle },
          bottom: { style: 'thin' as BorderStyle },
          right: { style: 'thin' as BorderStyle }
        };
      });
      
      metaSheet.addRow({ parameter: 'Отчет сгенерирован', value: new Date().toLocaleString('ru-RU') });
      metaSheet.addRow({ parameter: 'Идентификатор отчета', value: uuidv4() });
      metaSheet.addRow({ parameter: 'Версия системы', value: 'Система формирования отчетов МЧС v1.0' });
      
      // Применяем стили к строкам
      metaSheet.eachRow((row, rowIndex) => {
        if (rowIndex > 1) { // Пропускаем заголовки
          row.eachCell(cell => {
            cell.border = {
              top: { style: 'thin' as BorderStyle },
              left: { style: 'thin' as BorderStyle },
              bottom: { style: 'thin' as BorderStyle },
              right: { style: 'thin' as BorderStyle }
            };
          });
        }
      });
      
      // Сохраняем файл
      await workbook.xlsx.writeFile(filePath);
      this.logger.log(`Excel report generated successfully: ${filePath}`);
      
      return filePath;
    } catch (error) {
      this.logger.error(`Failed to generate Excel: ${error.message}`);
      throw error;
    }
  }

  /**
   * Генерирует PDF-отчет со статистикой по пожарам за период
   */
  async generateStatisticsReport(startDate: Date, endDate: Date, stationId?: number): Promise<string> {
    try {
      this.logger.log(`Начало генерации статистического отчета PDF: ${startDate} - ${endDate}, stationId: ${stationId}`);
      
      // Формируем фильтр
      const filter: Record<string, any> = {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      };

      // Если указана конкретная пожарная часть
      if (stationId) {
        filter.fireStationId = stationId;
      }

      this.logger.log(`Запрос пожаров с фильтром: ${JSON.stringify(filter)}`);
      
      // Получаем данные о пожарах за период с подробной информацией
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
      
      // Типизируем данные для работы с ними
      const fireIncidents = fireIncidentsData as unknown as FireIncidentWithRelations[];

      // Подсчитываем статистику
      const totalIncidents = fireIncidents.length;
      const resolvedIncidents = fireIncidents.filter(incident => incident.status === IncidentStatus.RESOLVED).length;
      const inProgressIncidents = fireIncidents.filter(incident => incident.status === IncidentStatus.IN_PROGRESS).length;
      const pendingIncidents = fireIncidents.filter(incident => incident.status === IncidentStatus.PENDING).length;
      const cancelledIncidents = fireIncidents.filter(incident => incident.status === IncidentStatus.CANCELLED).length;

      // Статистика по уровням пожаров
      const incidentsByLevel: Record<string, number> = {};
      
      // Статистика по станциям
      const incidentsByStation: Record<string, number> = {};
      
      // Среднее время реагирования и разрешения (в минутах)
      let totalResolutionTime = 0;
      let resolvedCount = 0;
      
      // Количество задействованных машин
      let totalVehiclesUsed = 0;
      const vehiclesByType: Record<string, number> = {};
      
      // Популярные адреса пожаров
      const addressFrequency: Record<string, number> = {};

      // Сбор статистики
      fireIncidents.forEach((incident: any) => {
        // Статистика по уровням пожаров
        const levelNum = incident.fireLevel ? incident.fireLevel.level : 'Неизвестный';
        incidentsByLevel[String(levelNum)] = (incidentsByLevel[String(levelNum)] || 0) + 1;
        
        // Статистика по пожарным частям
        const stationName = incident.fireStation ? incident.fireStation.name : 'Неизвестно';
        incidentsByStation[stationName] = (incidentsByStation[stationName] || 0) + 1;
        
        // Подсчет времени разрешения для завершенных инцидентов
        if (incident.status === IncidentStatus.RESOLVED && incident.resolvedAt) {
          const resolutionTimeMinutes = 
            Math.floor((incident.resolvedAt.getTime() - incident.createdAt.getTime()) / (1000 * 60));
          totalResolutionTime += resolutionTimeMinutes;
          resolvedCount++;
        }
        
        // Подсчет машин по типам
        if (incident.vehicles && incident.vehicles.length > 0) {
          totalVehiclesUsed += incident.vehicles.length;
          
          incident.vehicles.forEach((vehicle: any) => {
            // Т.к. engineType недоступен, используем тип из vehicle
            const vehicleType = vehicle.type || 'Неизвестный';
            vehiclesByType[vehicleType] = (vehiclesByType[vehicleType] || 0) + 1;
          });
        }
        
        // Подсчет частоты адресов
        if (incident.address) {
          addressFrequency[incident.address] = (addressFrequency[incident.address] || 0) + 1;
        }
      });
      
      const averageResolutionTime = resolvedCount > 0 ? 
        Math.floor(totalResolutionTime / resolvedCount) : 0;
      
      // Сортируем по частоте для определения самых проблемных адресов
      const topAddresses = Object.entries(addressFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5); // Топ-5 адресов

      // Создаем уникальное имя файла
      const fileName = `statistics_report_${uuidv4()}.pdf`;
      const filePath = path.join(this.reportsDir, fileName);
      
      // Получаем информацию о станции, если указана
      let stationInfo = '';
      if (stationId) {
        const station = await this.prisma.fireStation.findUnique({ where: { id: stationId } });
        if (station) {
          stationInfo = station.name;
        }
      }

      // Создаем массив для содержимого документа
      const content: Content[] = [
        // Заголовок отчета
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
      
      // Добавляем информацию о пожарной части, если указана
      if (stationInfo) {
        content.push({
          text: `Пожарная часть: ${stationInfo}`,
          style: 'subheader',
          alignment: 'center',
          margin: [0, 0, 0, 20]
        });
      } else {
        content.push({ text: '', margin: [0, 0, 0, 20] });
      }
      
      // Общая статистика
      content.push(
        {
          text: 'Общая статистика',
          style: 'sectionHeader'
        }
      );
      
      // Таблица с общей статистикой
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
      
      // Статистика по уровням пожаров
      content.push(
        {
          text: 'Пожары по уровням',
          style: 'sectionHeader'
        }
      );
      
      // Проверяем, есть ли данные по уровням
      if (Object.keys(incidentsByLevel).length > 0) {
        // Создаем таблицу по уровням
        const levelRows = Object.keys(incidentsByLevel)
          .sort((a, b) => {
            const numA = parseInt(a);
            const numB = parseInt(b);
            if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
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
      } else {
        content.push({ text: 'Нет данных по уровням пожаров', alignment: 'center' });
      }
      
      content.push({ text: '', margin: [0, 10, 0, 10] });
      
      // Статистика по пожарным частям
      content.push(
        {
          text: 'Пожары по пожарным частям',
          style: 'sectionHeader'
        }
      );
      
      // Проверяем, есть ли данные по пожарным частям
      if (Object.keys(incidentsByStation).length > 0) {
        // Создаем таблицу по пожарным частям
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
      } else {
        content.push({ text: 'Нет данных по пожарным частям', alignment: 'center' });
      }
      
      content.push({ text: '', margin: [0, 10, 0, 10] });
      
      // Статистика по типам машин
      content.push(
        {
          text: 'Машины по типам',
          style: 'sectionHeader'
        }
      );
      
      // Проверяем, есть ли данные по машинам
      if (Object.keys(vehiclesByType).length > 0) {
        // Создаем таблицу по типам машин
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
      } else {
        content.push({ text: 'Нет данных по машинам', alignment: 'center' });
      }
      
      content.push({ text: '', margin: [0, 10, 0, 10] });
      
      // Топ адресов пожаров
      if (topAddresses.length > 0) {
        content.push(
          {
            text: 'Наиболее частые адреса пожаров',
            style: 'sectionHeader'
          }
        );
        
        // Создаем таблицу топ адресов
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
      
      // Список всех пожаров
      content.push(
        {
          text: 'Список пожаров',
          style: 'sectionHeader'
        }
      );
      
      // Проверяем, есть ли данные о пожарах
      if (fireIncidents.length > 0) {
        // Создаем таблицу пожаров (без ограничения количества)
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
      } else {
        content.push({ text: 'Нет данных о пожарах за указанный период', alignment: 'center' });
      }
      
      // Служебная информация
      content.push(
        { text: '', pageBreak: 'before' },
        {
          text: 'Служебная информация',
          style: 'sectionHeader'
        },
        {
          fontSize: 10,
          stack: [
            `Отчет сгенерирован: ${new Date().toLocaleString('ru-RU')}`,
            `Идентификатор отчета: ${uuidv4()}`,
            'Система диспетчеризации МЧС v1.0'
          ]
        }
      );
      
      // Создаем структуру документа для pdfmake
      const documentDefinition: TDocumentDefinitions = {
        info: {
          title: 'Статистический отчет',
          author: 'Система диспетчеризации МЧС',
          subject: 'Статистика пожаров',
          keywords: 'пожар, отчет, статистика',
        },
        pageSize: 'A4',
        pageMargins: [40, 60, 40, 60],
        content: content,
        
        // Стили для документа
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
        
        // Нижний колонтитул с номерами страниц
        footer: (currentPage, pageCount) => ({ 
          text: `Страница ${currentPage} из ${pageCount}`, 
          alignment: 'center',
          fontSize: 8,
          margin: [0, 10, 0, 0]
        })
      };
      
      // Создаем PDF и сохраняем его
      return await this.pdfGenerator.createPdf(documentDefinition, filePath);
    } catch (error) {
      this.logger.error(`Critical error generating report: ${error.message}`);
      this.logger.error(error.stack);
      throw error;
    }
  }
  
  /**
   * Возвращает текстовое представление статуса
   */
  private getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'PENDING': 'Ожидание',
      'IN_PROGRESS': 'В процессе',
      'RESOLVED': 'Разрешено',
      'CANCELLED': 'Отменено'
    };
    
    return statusMap[status] || status;
  }

  /**
   * Возвращает английский текст статуса для отчетов на английском
   */
  private getStatusInEnglish(status: string): string {
    const statusMap: Record<string, string> = {
      'PENDING': 'Pending',
      'IN_PROGRESS': 'In Progress',
      'RESOLVED': 'Resolved',
      'CANCELLED': 'Cancelled'
    };
    
    return statusMap[status] || status;
  }

  /**
   * Вспомогательная функция для рисования таблиц в PDF
   */
  private drawTable(doc: any, data: { headers: string[], rows: string[][] }, x: number, y: number, options: { maxRows?: number } = {}) {
    const { headers, rows } = data;
    const maxRows = options.maxRows || rows.length;
    const limitedRows = rows.slice(0, maxRows);
    
    // Определим ширину колонок (равномерно распределим по ширине страницы)
    const pageWidth = doc.page.width - 2 * x;
    const colWidth = pageWidth / headers.length;
    
    // Стили
    const headerFillColor = '#E2E8F0';
    const borderColor = '#94A3B8';
    const textColor = '#0F172A';
    const alternateRowColor = '#F8FAFC';
    
    // Начальная Y позиция
    let currentY = y;
    
    // Убедимся, что шрифт установлен
    doc.font('Helvetica');
    
    // Рисуем заголовки
    doc.fillColor(headerFillColor);
    doc.rect(x, currentY, pageWidth, 25).fill();
    doc.fillColor(textColor);
    
    headers.forEach((header, i) => {
      doc.font('Helvetica-Bold').fontSize(10).text(
        header,
        x + i * colWidth + 5,
        currentY + 7,
        { width: colWidth - 10, align: 'left' }
      );
    });
    
    // Рисуем линию после заголовков
    currentY += 25;
    doc.strokeColor(borderColor);
    doc.moveTo(x, currentY).lineTo(x + pageWidth, currentY).stroke();
    
    // Рисуем строки данных
    limitedRows.forEach((row, rowIndex) => {
      // Альтернативный цвет для четных строк
      if (rowIndex % 2 === 1) {
        doc.fillColor(alternateRowColor);
        doc.rect(x, currentY, pageWidth, 20).fill();
        doc.fillColor(textColor);
      }
      
      // Текст ячеек
      row.forEach((cell, colIndex) => {
        // Первый столбец жирным шрифтом, остальные - обычным
        const font = colIndex === 0 ? 'Helvetica-Bold' : 'Helvetica';
        doc.font(font).fontSize(9).text(
          cell,
          x + colIndex * colWidth + 5,
          currentY + 5,
          { width: colWidth - 10, align: 'left' }
        );
      });
      
      // Линия после строки
      currentY += 20;
      doc.strokeColor(borderColor);
      doc.moveTo(x, currentY).lineTo(x + pageWidth, currentY).stroke();
      
      // Если достигли конца страницы, добавляем новую
      if (currentY > doc.page.height - 70) {
        doc.addPage();
        
        // Рисуем заголовки на новой странице
        currentY = 50; // Сброс Y-позиции для новой страницы
        
        doc.fillColor(headerFillColor);
        doc.rect(x, currentY, pageWidth, 25).fill();
        doc.fillColor(textColor);
        
        headers.forEach((header, i) => {
          doc.font('Helvetica-Bold').fontSize(10).text(
            header,
            x + i * colWidth + 5,
            currentY + 7,
            { width: colWidth - 10, align: 'left' }
          );
        });
        
        // Рисуем линию после заголовков
        currentY += 25;
        doc.strokeColor(borderColor);
        doc.moveTo(x, currentY).lineTo(x + pageWidth, currentY).stroke();
      }
    });
    
    // Рисуем вертикальные линии для разделения колонок
    for (let i = 0; i <= headers.length; i++) {
      doc.moveTo(x + i * colWidth, y).lineTo(x + i * colWidth, currentY).stroke();
    }
    
    // Устанавливаем текущую позицию после таблицы
    doc.y = currentY + 10;
  }

  /**
   * Рассчитывает расстояние между двумя координатами в километрах
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): string {
    const R = 6371; // Радиус Земли в км
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Расстояние в км
    return distance.toFixed(2);
  }

  /**
   * Конвертирует градусы в радианы
   */
  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Генерирует Excel-отчет со статистикой по пожарам за период
   */
  async generateStatisticsExcel(startDate: Date, endDate: Date, stationId?: number): Promise<string> {
    try {
      this.logger.log(`Начало генерации статистического отчета Excel: ${startDate} - ${endDate}, stationId: ${stationId}`);
      
      // Формируем фильтр
      const filter: Record<string, any> = {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      };

      // Если указана конкретная пожарная часть
      if (stationId) {
        filter.fireStationId = stationId;
      }

      this.logger.log(`Запрос пожаров с фильтром: ${JSON.stringify(filter)}`);
      
      // Получаем данные о пожарах за период с подробной информацией
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
      
      // Типизируем данные для работы с ними
      const fireIncidents = fireIncidentsData as unknown as FireIncidentWithRelations[];

      // Подсчитываем статистику
      const totalIncidents = fireIncidents.length;
      const resolvedIncidents = fireIncidents.filter(incident => incident.status === IncidentStatus.RESOLVED).length;
      const inProgressIncidents = fireIncidents.filter(incident => incident.status === IncidentStatus.IN_PROGRESS).length;
      const pendingIncidents = fireIncidents.filter(incident => incident.status === IncidentStatus.PENDING).length;
      const cancelledIncidents = fireIncidents.filter(incident => incident.status === IncidentStatus.CANCELLED).length;

      // Статистика по уровням пожаров
      const incidentsByLevel: Record<string, number> = {};
      
      // Статистика по станциям
      const incidentsByStation: Record<string, number> = {};
      
      // Среднее время реагирования и разрешения (в минутах)
      let totalResolutionTime = 0;
      let resolvedCount = 0;
      
      // Количество задействованных машин
      let totalVehiclesUsed = 0;
      const vehiclesByType: Record<string, number> = {};
      
      // Популярные адреса пожаров
      const addressFrequency: Record<string, number> = {};

      // Сбор статистики
      fireIncidents.forEach((incident: any) => {
        // Статистика по уровням пожаров
        const levelNum = incident.fireLevel ? incident.fireLevel.level : 'Неизвестный';
        incidentsByLevel[String(levelNum)] = (incidentsByLevel[String(levelNum)] || 0) + 1;
        
        // Статистика по пожарным частям
        const stationName = incident.fireStation ? incident.fireStation.name : 'Неизвестно';
        incidentsByStation[stationName] = (incidentsByStation[stationName] || 0) + 1;
        
        // Подсчет времени разрешения для завершенных инцидентов
        if (incident.status === IncidentStatus.RESOLVED && incident.resolvedAt) {
          const resolutionTimeMinutes = 
            Math.floor((incident.resolvedAt.getTime() - incident.createdAt.getTime()) / (1000 * 60));
          totalResolutionTime += resolutionTimeMinutes;
          resolvedCount++;
        }
        
        // Подсчет машин по типам
        if (incident.vehicles && incident.vehicles.length > 0) {
          totalVehiclesUsed += incident.vehicles.length;
          
          incident.vehicles.forEach((vehicle: any) => {
            // Т.к. engineType недоступен, используем тип из vehicle
            const vehicleType = vehicle.type || 'Неизвестный';
            vehiclesByType[vehicleType] = (vehiclesByType[vehicleType] || 0) + 1;
          });
        }
        
        // Подсчет частоты адресов
        if (incident.address) {
          addressFrequency[incident.address] = (addressFrequency[incident.address] || 0) + 1;
        }
      });
      
      const averageResolutionTime = resolvedCount > 0 ? 
        Math.floor(totalResolutionTime / resolvedCount) : 0;
      
      // Сортируем по частоте для определения самых проблемных адресов
      const topAddresses = Object.entries(addressFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5); // Топ-5 адресов

      // Создаем уникальное имя файла
      const fileName = `statistics_report_${uuidv4()}.xlsx`;
      const filePath = path.join(this.reportsDir, fileName);

      // Получаем информацию о станции, если указана
      let stationInfo = '';
      if (stationId) {
        const station = await this.prisma.fireStation.findUnique({ where: { id: stationId } });
        if (station) {
          stationInfo = station.name;
        }
      }

      // Создаем Excel файл
      const workbook = new Excel.Workbook();
      workbook.creator = 'Система диспетчеризации МЧС';
      workbook.lastModifiedBy = 'Система диспетчеризации МЧС';
      workbook.created = new Date();
      workbook.modified = new Date();
      
      // Лист с общей статистикой
      const statsSheet = workbook.addWorksheet('Общая статистика');
      
      // Добавляем заголовок
      const titleRow = statsSheet.addRow(['Статистический отчет по пожарам']);
      titleRow.font = { bold: true, size: 16 };
      statsSheet.mergeCells('A1:B1');
      titleRow.alignment = { horizontal: 'center' };
      
      // Информация о периоде
      const periodRow = statsSheet.addRow([`Период: ${startDate.toLocaleDateString('ru-RU')} - ${endDate.toLocaleDateString('ru-RU')}`]);
      statsSheet.mergeCells('A2:B2');
      periodRow.alignment = { horizontal: 'center' };
      
      // Информация о пожарной части
      if (stationInfo) {
        const stationRow = statsSheet.addRow([`Пожарная часть: ${stationInfo}`]);
        statsSheet.mergeCells('A3:B3');
        stationRow.alignment = { horizontal: 'center' };
        statsSheet.addRow([]);
      } else {
        statsSheet.addRow([]);
      }
      
      // Настраиваем колонки
      statsSheet.columns = [
        { header: 'Параметр', key: 'parameter', width: 30 },
        { header: 'Значение', key: 'value', width: 40 }
      ];
      
      // Добавляем заголовок, если колонки еще не созданы
      if (!statsSheet.getRow(1).getCell(1).value) {
        statsSheet.getRow(1).values = ['Параметр', 'Значение'];
      }
      
      // Стиль для заголовков
      const headerRow = statsSheet.getRow(1);
      headerRow.eachCell(cell => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD3D3D3' }
        };
        cell.border = {
          top: { style: 'thin' as BorderStyle },
          left: { style: 'thin' as BorderStyle },
          bottom: { style: 'thin' as BorderStyle },
          right: { style: 'thin' as BorderStyle }
        };
      });
      
      // Добавляем общую статистику
      const statsRows = [
        { parameter: 'Всего пожаров', value: totalIncidents },
        { parameter: 'Разрешенных пожаров', value: resolvedIncidents },
        { parameter: 'В процессе', value: inProgressIncidents },
        { parameter: 'Ожидающих', value: pendingIncidents },
        { parameter: 'Отмененных', value: cancelledIncidents },
        { parameter: 'Среднее время разрешения', value: `${averageResolutionTime} мин (${Math.floor(averageResolutionTime / 60)}ч ${averageResolutionTime % 60}м)` },
        { parameter: 'Всего использовано машин', value: totalVehiclesUsed }
      ];
      
      // Добавляем строки в таблицу
      statsRows.forEach(row => {
        statsSheet.addRow(row);
      });
      
      // Применяем стили к строкам
      statsSheet.eachRow((row, rowIndex) => {
        if (rowIndex > 1) {
          row.eachCell((cell, colIndex) => {
            cell.border = {
              top: { style: 'thin' as BorderStyle },
              left: { style: 'thin' as BorderStyle },
              bottom: { style: 'thin' as BorderStyle },
              right: { style: 'thin' as BorderStyle }
            };
            
            // Чередующийся цвет строк
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
      
      // Лист с данными по уровням пожаров
      if (Object.keys(incidentsByLevel).length > 0) {
        const levelsSheet = workbook.addWorksheet('Уровни пожаров');
        
        levelsSheet.columns = [
          { header: 'Уровень', key: 'level', width: 20 },
          { header: 'Количество', key: 'count', width: 20 },
          { header: 'Процент', key: 'percent', width: 20 }
        ];
        
        // Стиль для заголовков
        const levelsHeaderRow = levelsSheet.getRow(1);
        levelsHeaderRow.eachCell(cell => {
          cell.font = { bold: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' }
          };
          cell.border = {
            top: { style: 'thin' as BorderStyle },
            left: { style: 'thin' as BorderStyle },
            bottom: { style: 'thin' as BorderStyle },
            right: { style: 'thin' as BorderStyle }
          };
        });
        
        // Добавляем данные по уровням
        Object.keys(incidentsByLevel)
          .sort((a, b) => {
            const numA = parseInt(a);
            const numB = parseInt(b);
            if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
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
        
        // Применяем стили к строкам
        levelsSheet.eachRow((row, rowIndex) => {
          if (rowIndex > 1) {
            row.eachCell(cell => {
              cell.border = {
                top: { style: 'thin' as BorderStyle },
                left: { style: 'thin' as BorderStyle },
                bottom: { style: 'thin' as BorderStyle },
                right: { style: 'thin' as BorderStyle }
              };
              
              // Чередующийся цвет строк
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
      
      // Лист с данными по пожарным частям
      if (Object.keys(incidentsByStation).length > 0) {
        const stationsSheet = workbook.addWorksheet('Пожарные части');
        
        stationsSheet.columns = [
          { header: 'Пожарная часть', key: 'station', width: 40 },
          { header: 'Количество', key: 'count', width: 20 },
          { header: 'Процент', key: 'percent', width: 20 }
        ];
        
        // Стиль для заголовков
        const stationsHeaderRow = stationsSheet.getRow(1);
        stationsHeaderRow.eachCell(cell => {
          cell.font = { bold: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' }
          };
          cell.border = {
            top: { style: 'thin' as BorderStyle },
            left: { style: 'thin' as BorderStyle },
            bottom: { style: 'thin' as BorderStyle },
            right: { style: 'thin' as BorderStyle }
          };
        });
        
        // Добавляем данные по пожарным частям
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
        
        // Применяем стили к строкам
        stationsSheet.eachRow((row, rowIndex) => {
          if (rowIndex > 1) {
            row.eachCell(cell => {
              cell.border = {
                top: { style: 'thin' as BorderStyle },
                left: { style: 'thin' as BorderStyle },
                bottom: { style: 'thin' as BorderStyle },
                right: { style: 'thin' as BorderStyle }
              };
              
              // Чередующийся цвет строк
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
      
      // Лист с данными по типам машин
      if (Object.keys(vehiclesByType).length > 0) {
        const vehiclesSheet = workbook.addWorksheet('Машины');
        
        vehiclesSheet.columns = [
          { header: 'Тип машины', key: 'type', width: 40 },
          { header: 'Количество', key: 'count', width: 20 }
        ];
        
        // Стиль для заголовков
        const vehiclesHeaderRow = vehiclesSheet.getRow(1);
        vehiclesHeaderRow.eachCell(cell => {
          cell.font = { bold: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' }
          };
          cell.border = {
            top: { style: 'thin' as BorderStyle },
            left: { style: 'thin' as BorderStyle },
            bottom: { style: 'thin' as BorderStyle },
            right: { style: 'thin' as BorderStyle }
          };
        });
        
        // Добавляем данные по типам машин
        Object.keys(vehiclesByType)
          .sort()
          .forEach((type, index) => {
            vehiclesSheet.addRow({
              type,
              count: vehiclesByType[type]
            });
          });
        
        // Применяем стили к строкам
        vehiclesSheet.eachRow((row, rowIndex) => {
          if (rowIndex > 1) {
            row.eachCell(cell => {
              cell.border = {
                top: { style: 'thin' as BorderStyle },
                left: { style: 'thin' as BorderStyle },
                bottom: { style: 'thin' as BorderStyle },
                right: { style: 'thin' as BorderStyle }
              };
              
              // Чередующийся цвет строк
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
      
      // Лист с топ-адресами
      if (topAddresses.length > 0) {
        const addressesSheet = workbook.addWorksheet('Проблемные адреса');
        
        addressesSheet.columns = [
          { header: 'Адрес', key: 'address', width: 50 },
          { header: 'Количество происшествий', key: 'count', width: 30 }
        ];
        
        // Стиль для заголовков
        const addressesHeaderRow = addressesSheet.getRow(1);
        addressesHeaderRow.eachCell(cell => {
          cell.font = { bold: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' }
          };
          cell.border = {
            top: { style: 'thin' as BorderStyle },
            left: { style: 'thin' as BorderStyle },
            bottom: { style: 'thin' as BorderStyle },
            right: { style: 'thin' as BorderStyle }
          };
        });
        
        // Добавляем топ адреса
        topAddresses.forEach(([address, count], index) => {
          addressesSheet.addRow({
            address,
            count
          });
        });
        
        // Применяем стили к строкам
        addressesSheet.eachRow((row, rowIndex) => {
          if (rowIndex > 1) {
            row.eachCell(cell => {
              cell.border = {
                top: { style: 'thin' as BorderStyle },
                left: { style: 'thin' as BorderStyle },
                bottom: { style: 'thin' as BorderStyle },
                right: { style: 'thin' as BorderStyle }
              };
              
              // Чередующийся цвет строк
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
      
      // Лист со всеми пожарами
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
      
      // Стиль для заголовков
      const incidentsHeaderRow = incidentsSheet.getRow(1);
      incidentsHeaderRow.eachCell(cell => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD3D3D3' }
        };
        cell.border = {
          top: { style: 'thin' as BorderStyle },
          left: { style: 'thin' as BorderStyle },
          bottom: { style: 'thin' as BorderStyle },
          right: { style: 'thin' as BorderStyle }
        };
      });
      
      // Добавляем все пожары
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
      
      // Применяем стили к строкам
      incidentsSheet.eachRow((row, rowIndex) => {
        if (rowIndex > 1) {
          row.eachCell(cell => {
            cell.border = {
              top: { style: 'thin' as BorderStyle },
              left: { style: 'thin' as BorderStyle },
              bottom: { style: 'thin' as BorderStyle },
              right: { style: 'thin' as BorderStyle }
            };
            
            // Чередующийся цвет строк
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
      
      // Лист со служебной информацией
      const metaSheet = workbook.addWorksheet('Служебная информация');
      
      metaSheet.columns = [
        { header: 'Параметр', key: 'parameter', width: 30 },
        { header: 'Значение', key: 'value', width: 50 }
      ];
      
      // Стиль для заголовков
      const metaHeaderRow = metaSheet.getRow(1);
      metaHeaderRow.eachCell(cell => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD3D3D3' }
        };
        cell.border = {
          top: { style: 'thin' as BorderStyle },
          left: { style: 'thin' as BorderStyle },
          bottom: { style: 'thin' as BorderStyle },
          right: { style: 'thin' as BorderStyle }
        };
      });
      
      // Добавляем служебную информацию
      metaSheet.addRow({ parameter: 'Отчет сгенерирован', value: new Date().toLocaleString('ru-RU') });
      metaSheet.addRow({ parameter: 'Идентификатор отчета', value: uuidv4() });
      metaSheet.addRow({ parameter: 'Версия системы', value: 'Система формирования отчетов МЧС v1.0' });
      
      // Применяем стили к строкам
      metaSheet.eachRow((row, rowIndex) => {
        if (rowIndex > 1) {
          row.eachCell(cell => {
            cell.border = {
              top: { style: 'thin' as BorderStyle },
              left: { style: 'thin' as BorderStyle },
              bottom: { style: 'thin' as BorderStyle },
              right: { style: 'thin' as BorderStyle }
            };
          });
        }
      });
      
      // Сохраняем файл
      await workbook.xlsx.writeFile(filePath);
      this.logger.log(`Excel отчет со статистикой успешно создан: ${filePath}`);
      
      return filePath;
    } catch (error) {
      this.logger.error(`Ошибка при создании Excel отчета: ${error.message}`);
      this.logger.error(error.stack);
      throw error;
    }
  }
}

