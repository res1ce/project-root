import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async logActivity(
    userId: number,
    action: string,
    details?: any,
    request?: any,
  ) {
    try {
      return await this.prisma.userActivity.create({
        data: {
          userId,
          action,
          details: details ? JSON.stringify(details) : null,
          ipAddress: request?.ip,
          userAgent: request?.headers?.['user-agent'],
        },
      });
    } catch (error) {
      console.error('Failed to log user activity:', error);
      // Не выбрасываем ошибку, чтобы не блокировать основной поток
      return null;
    }
  }

  async getUserActivities(userId?: number, action?: string, limit = 100) {
    const where: any = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;

    return this.prisma.userActivity.findMany({
      where,
      include: { user: true },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }
} 