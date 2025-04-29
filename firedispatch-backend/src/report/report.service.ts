import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { FireEventsGateway } from '../fire/fire-events.gateway';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);
  private readonly reportsDir: string;

  constructor(
    @Inject(FireEventsGateway) private readonly events: FireEventsGateway,
    private prisma: PrismaService
  ) {
    // Создаем папку для отчетов, если её нет
    this.reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
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
      // Получаем данные о пожаре
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

      // Создаем уникальное имя файла
      const fileName = `fire_report_${fireIncidentId}_${uuidv4()}.pdf`;
      const filePath = path.join(this.reportsDir, fileName);

      // Создаем PDF документ
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filePath);
      
      doc.pipe(stream);

      // Заголовок отчета
      doc.fontSize(25).text('Отчет о пожаре', { align: 'center' });
      doc.moveDown();

      // Основная информация о пожаре
      doc.fontSize(14).text(`Номер пожара: ${fireIncident.id}`);
      doc.text(`Дата регистрации: ${fireIncident.createdAt.toLocaleString('ru-RU')}`);
      doc.text(`Статус: ${this.getStatusText(String(fireIncident.status))}`);
      doc.text(`Уровень пожара: ${fireIncident.fireLevel.level}`);
      doc.text(`Координаты: ${fireIncident.latitude}, ${fireIncident.longitude}`);
      
      if (fireIncident.resolvedAt) {
        doc.text(`Дата разрешения: ${fireIncident.resolvedAt.toLocaleString('ru-RU')}`);
      }
      
      doc.moveDown();

      // Информация о пожарной части
      doc.fontSize(16).text('Пожарная часть');
      doc.fontSize(12);
      doc.text(`Название: ${fireIncident.fireStation.name}`);
      doc.text(`Адрес: ${fireIncident.fireStation.address}`);
      doc.moveDown();

      // Информация о диспетчерах
      doc.fontSize(16).text('Ответственные лица');
      doc.fontSize(12);
      doc.text(`Сообщил о пожаре: ${fireIncident.reportedBy.name} (${fireIncident.reportedBy.role})`);
      doc.text(`Назначен: ${fireIncident.assignedTo.name} (${fireIncident.assignedTo.role})`);
      doc.moveDown();

      // Информация о задействованных машинах
      doc.fontSize(16).text('Задействованные машины');
      doc.fontSize(12);
      if (fireIncident.vehicles.length === 0) {
        doc.text('Нет задействованных машин');
      } else {
        fireIncident.vehicles.forEach((vehicle: any, index: number) => {
          doc.text(`${index + 1}. ${vehicle.model} (${vehicle.type})`);
        });
      }
      doc.moveDown();

      // Информация об отчетах
      doc.fontSize(16).text('Отчеты');
      doc.fontSize(12);
      if (fireIncident.reports.length === 0) {
        doc.text('Нет отчетов');
      } else {
        fireIncident.reports.forEach((report: any, index: number) => {
          doc.text(`Отчет от ${report.createdAt.toLocaleString('ru-RU')}`);
          doc.text(`Автор: ${report.user.name} (${report.user.role})`);
          doc.text(`Содержание: ${report.content}`);
          
          if (index < fireIncident.reports.length - 1) {
            doc.moveDown(0.5);
          }
        });
      }

      // Завершаем документ
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
    } catch (error) {
      this.logger.error(`Failed to generate PDF: ${error.message}`);
      throw error;
    }
  }

  /**
   * Генерирует PDF-отчет со статистикой по пожарам за период
   */
  async generateStatisticsReport(startDate: Date, endDate: Date, stationId?: number): Promise<string> {
    try {
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

      // Получаем данные о пожарах за период
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

      // Подсчитываем статистику
      const totalIncidents = fireIncidents.length;
      const resolvedIncidents = fireIncidents.filter(incident => incident.status === 'RESOLVED').length;
      const inProgressIncidents = fireIncidents.filter(incident => incident.status === 'IN_PROGRESS').length;
      const pendingIncidents = fireIncidents.filter(incident => incident.status === 'PENDING').length;

      const incidentsByLevel: Record<number, number> = {};
      const incidentsByStation: Record<string, number> = {};

      fireIncidents.forEach((incident: any) => {
        // Статистика по уровням
        incidentsByLevel[incident.level] = (incidentsByLevel[incident.level] || 0) + 1;
        
        // Статистика по пожарным частям
        const stationName = incident.fireStation.name;
        incidentsByStation[stationName] = (incidentsByStation[stationName] || 0) + 1;
      });

      // Создаем уникальное имя файла
      const fileName = `statistics_report_${uuidv4()}.pdf`;
      const filePath = path.join(this.reportsDir, fileName);

      // Создаем PDF документ
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filePath);
      
      doc.pipe(stream);

      // Заголовок отчета
      doc.fontSize(25).text('Статистический отчет по пожарам', { align: 'center' });
      doc.fontSize(14).text(`Период: ${startDate.toLocaleDateString('ru-RU')} - ${endDate.toLocaleDateString('ru-RU')}`, { align: 'center' });
      doc.moveDown();

      // Основная статистика
      doc.fontSize(16).text('Общая статистика');
      doc.fontSize(12);
      doc.text(`Всего пожаров: ${totalIncidents}`);
      doc.text(`Разрешенные пожары: ${resolvedIncidents}`);
      doc.text(`В процессе: ${inProgressIncidents}`);
      doc.text(`Ожидающие обработки: ${pendingIncidents}`);
      doc.moveDown();

      // Статистика по уровням
      doc.fontSize(16).text('Пожары по уровням');
      doc.fontSize(12);
      Object.keys(incidentsByLevel).sort((a, b) => parseInt(a) - parseInt(b)).forEach(level => {
        doc.text(`Уровень ${level}: ${incidentsByLevel[Number(level)]} пожаров`);
      });
      doc.moveDown();

      // Статистика по пожарным частям
      doc.fontSize(16).text('Пожары по пожарным частям');
      doc.fontSize(12);
      Object.keys(incidentsByStation).forEach(station => {
        doc.text(`${station}: ${incidentsByStation[station]} пожаров`);
      });
      doc.moveDown();

      // Список всех пожаров
      doc.fontSize(16).text('Список пожаров за период');
      doc.fontSize(12);
      
      fireIncidents.forEach((incident: any, index: number) => {
        doc.text(`${index + 1}. Пожар #${incident.id}`);
        doc.text(`   Дата: ${incident.createdAt.toLocaleString('ru-RU')}`);
        doc.text(`   Статус: ${this.getStatusText(String(incident.status))}`);
        doc.text(`   Уровень: ${incident.level}`);
        doc.text(`   Пожарная часть: ${incident.fireStation.name}`);
        
        if (index < fireIncidents.length - 1) {
          doc.moveDown(0.5);
        }
      });

      // Завершаем документ
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
    } catch (error) {
      this.logger.error(`Failed to generate statistics report: ${error.message}`);
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
}
