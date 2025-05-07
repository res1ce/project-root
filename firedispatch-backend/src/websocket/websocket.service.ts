import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Server } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WebsocketService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WebsocketService.name);
  private server: Server;
  private keepAliveInterval: NodeJS.Timeout;

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    this.logger.log('WebSocket Service initialized');
  }

  onModuleDestroy() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.logger.log('KeepAlive service stopped');
    }
  }

  setServer(server: Server) {
    this.server = server;
    this.logger.log('WebSocket server instance set in WebsocketService');
    // Запускаем keepalive сервис после установки сервера
    this.startKeepAlive();
  }

  // Функция для периодической отправки keepalive событий
  private startKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
    }

    this.keepAliveInterval = setInterval(() => {
      if (!this.server) return;
      
      try {
        // Отправляем keepalive всем подключенным клиентам
        const connectedClients = this.server.sockets.sockets.size;
        if (connectedClients > 0) {
          this.server.emit('server_keepalive', { timestamp: new Date(), message: 'Server is alive' });
          this.logger.debug(`Sent keepalive to ${connectedClients} clients`);
        }
      } catch (error) {
        this.logger.error(`Error sending keepalive: ${error.message}`);
      }
    }, 60000); // увеличиваем до 60 секунд (каждую минуту)
    
    this.logger.log('KeepAlive service started with 60s interval');
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

      // Проверяем, есть ли подключенные клиенты в комнате
      const room = this.server.sockets.adapter.rooms.get(`station_${stationId}`);
      if (!room || room.size === 0) {
        this.logger.warn(`No connected clients in station_${stationId} room, notification may be missed`);
      }

      this.server.to(`station_${stationId}`).emit('new_fire_incident', {
        fireIncident,
        message: 'Новый пожар требует вашего внимания!'
      });

      this.logger.log(`Notification about fire incident ${fireIncidentId} sent to station ${stationId}`);
      
      // Добавляем подтверждение доставки
      return { 
        success: true, 
        recipientsCount: room?.size || 0,
        sentAt: new Date()
      };
    } catch (error) {
      this.logger.error(`Failed to notify about fire incident: ${error.message}`);
      return { 
        success: false, 
        error: error.message
      };
    }
  }

  /**
   * Отправляет уведомление конкретному пользователю
   */
  sendNotificationToUser(userId: number, notification: any) {
    try {
      const room = this.server.sockets.adapter.rooms.get(`user_${userId}`);
      if (!room || room.size === 0) {
        this.logger.warn(`No connected clients for user_${userId}, notification may be missed`);
      }
      
      this.server.to(`user_${userId}`).emit('notification', notification);
      this.logger.log(`Notification sent to user ${userId}`);
      
      return {
        success: true,
        recipientsCount: room?.size || 0,
        sentAt: new Date()
      };
    } catch (error) {
      this.logger.error(`Failed to send notification to user ${userId}: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Отправляет уведомление всем пользователям с определенной ролью
   */
  sendNotificationToRole(role: string, notification: any) {
    try {
      const room = this.server.sockets.adapter.rooms.get(`role_${role}`);
      if (!room || room.size === 0) {
        this.logger.warn(`No connected clients with role_${role}, notification may be missed`);
      }
      
      this.server.to(`role_${role}`).emit('notification', notification);
      this.logger.log(`Notification sent to all users with role ${role}`);
      
      return {
        success: true,
        recipientsCount: room?.size || 0,
        sentAt: new Date()
      };
    } catch (error) {
      this.logger.error(`Failed to send notification to role ${role}: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
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
        return {
          success: false,
          error: 'Fire incident not found'
        };
      }

      // Данные для отправки
      const updateData = {
        fireIncidentId,
        status,
        updatedAt: new Date()
      };

      // Отправляем обновления в комнату пожарной части
      this.server.to(`station_${fireIncident.fireStationId}`).emit('fire_status_update', updateData);

      // Отправляем всем центральным диспетчерам
      this.server.to(`role_CENTRAL_DISPATCHER`).emit('fire_status_update', updateData);

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
      return {
        success: true,
        sentAt: new Date()
      };
    } catch (error) {
      this.logger.error(`Failed to send fire status update: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Получает информацию о текущих подключениях
   */
  getConnectionsInfo() {
    if (!this.server) {
      return {
        connected: false,
        totalConnections: 0,
        rooms: []
      };
    }
    
    const totalConnections = this.server.sockets.sockets.size;
    const rooms: Array<{name: string, connections: number}> = [];
    
    this.server.sockets.adapter.rooms.forEach((sockets, roomName) => {
      // Исключаем комнаты, представляющие ID сокета
      if (!this.server.sockets.sockets.has(roomName)) {
        rooms.push({
          name: roomName,
          connections: sockets.size
        });
      }
    });
    
    return {
      connected: true,
      totalConnections,
      rooms
    };
  }
} 