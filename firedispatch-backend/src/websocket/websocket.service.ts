import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WebsocketService {
  private readonly logger = new Logger(WebsocketService.name);
  private server: Server;

  constructor(private prisma: PrismaService) {}

  setServer(server: Server) {
    this.server = server;
  }

  /**
   * Отправляет уведомление о новом пожаре конкретной пожарной части
   */
  async notifyFireStationAboutFire(stationId: number, fireIncidentId: number) {
    try {
      const fireIncident = await this.prisma.fireIncident.findUnique({
        where: { id: fireIncidentId },
        include: {
          reportedBy: {
            select: { name: true }
          }
        }
      });

      if (!fireIncident) {
        this.logger.error(`Fire incident with ID ${fireIncidentId} not found`);
        return;
      }

      this.server.to(`station_${stationId}`).emit('new_fire_incident', {
        fireIncident,
        message: 'Новый пожар требует вашего внимания!'
      });

      this.logger.log(`Notification about fire incident ${fireIncidentId} sent to station ${stationId}`);
    } catch (error) {
      this.logger.error(`Failed to notify about fire incident: ${error.message}`);
    }
  }

  /**
   * Отправляет уведомление конкретному пользователю
   */
  sendNotificationToUser(userId: number, notification: any) {
    this.server.to(`user_${userId}`).emit('notification', notification);
    this.logger.log(`Notification sent to user ${userId}`);
  }

  /**
   * Отправляет уведомление всем пользователям с определенной ролью
   */
  sendNotificationToRole(role: string, notification: any) {
    this.server.to(`role_${role}`).emit('notification', notification);
    this.logger.log(`Notification sent to all users with role ${role}`);
  }

  /**
   * Отправляет обновление статуса пожара всем заинтересованным сторонам
   */
  async sendFireStatusUpdate(fireIncidentId: number, status: string) {
    try {
      const fireIncident = await this.prisma.fireIncident.findUnique({
        where: { id: fireIncidentId },
        include: {
          fireStation: true,
          assignedTo: {
            select: { id: true }
          },
          reportedBy: {
            select: { id: true }
          }
        }
      });

      if (!fireIncident) {
        this.logger.error(`Fire incident with ID ${fireIncidentId} not found`);
        return;
      }

      // Отправляем обновления в комнату пожарной части
      this.server.to(`station_${fireIncident.fireStationId}`).emit('fire_status_update', {
        fireIncidentId,
        status,
        updatedAt: new Date()
      });

      // Отправляем всем центральным диспетчерам
      this.server.to(`role_CENTRAL_DISPATCHER`).emit('fire_status_update', {
        fireIncidentId,
        status,
        updatedAt: new Date()
      });

      // Персональные уведомления
      this.sendNotificationToUser(fireIncident.assignedTo.id, {
        type: 'fire_status_update',
        message: `Статус пожара #${fireIncidentId} изменен на ${status}`,
        fireIncidentId
      });

      this.sendNotificationToUser(fireIncident.reportedBy.id, {
        type: 'fire_status_update',
        message: `Статус пожара #${fireIncidentId} изменен на ${status}`,
        fireIncidentId
      });

      this.logger.log(`Fire status update for fire incident ${fireIncidentId} sent to all relevant parties`);
    } catch (error) {
      this.logger.error(`Failed to send fire status update: ${error.message}`);
    }
  }
} 