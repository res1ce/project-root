import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    // Получаем общее количество пожаров
    const totalFires = await this.prisma.fireIncident.count();

    // Получаем количество активных пожаров (статусы PENDING и IN_PROGRESS)
    const activeFiresCount = await this.prisma.fireIncident.count({
      where: {
        OR: [
          { status: 'PENDING' },
          { status: 'IN_PROGRESS' },
        ],
      },
    });

    // Получаем количество потушенных пожаров (статус RESOLVED)
    const resolvedFiresCount = await this.prisma.fireIncident.count({
      where: {
        status: 'RESOLVED',
      },
    });

    // Получаем количество пожарных станций
    const stationsCount = await this.prisma.fireStation.count();

    // Возвращаем статистику
    return {
      totalFires,
      activeFiresCount,
      resolvedFiresCount,
      stationsCount,
    };
  }
} 