import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';

@WebSocketGateway({ 
  cors: {
    origin: ['http://localhost:3001', 'http://localhost:3000'],
    credentials: true
  },
  path: '/fire-events/socket.io',
  namespace: '/fire-events',
  transports: ['websocket'],
  connectTimeout: 60000,
})
export class FireEventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  async handleConnection(client: Socket) {
    const token = client.handshake.query?.token as string;
    if (!token) return client.disconnect();
    try {
      const user = jwt.verify(token, process.env.JWT_SECRET || 'supersecret');
      client.data.user = user;
      console.log(`[WebSocket] Клиент подключен: ${client.id}, роль: ${client.data.user?.role}`);
    } catch {
      return client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`[WebSocket] Клиент отключен: ${client.id}`);
  }

  fireCreated(fire: any) {
    console.log(`[WebSocket] Отправка уведомления о создании пожара #${fire.id}`);
    
    // Подготавливаем данные об уровне пожара
    let levelName = 'Неизвестный уровень';
    let levelId = null;
    
    // Проверяем все возможные источники информации об уровне
    if (fire.fireLevel) {
      levelName = fire.fireLevel.name;
      levelId = fire.fireLevel.id;
    } else if (typeof fire.level === 'object' && fire.level) {
      levelName = fire.level.name;
      levelId = fire.level.id;
    } else if (typeof fire.level === 'number') {
      levelName = `Уровень ${fire.level}`;
      levelId = fire.level;
    }
    
    // Получаем читаемый статус
    const readableStatus = this.getReadableStatus(fire.status);
    
    // Подготовим данные о пожаре с полной информацией
    const fireData = {
      ...fire,
      // Форматируем информацию об уровне для корректного отображения
      level: {
        name: levelName,
        id: levelId
      },
      // Добавляем читаемый статус
      readableStatus
    };
    
    // Отправляем уведомление всем клиентам
    this.server.emit('fireCreated', { 
      fire: fireData, 
      needsSound: false,
      needsVisualNotification: true,
      message: `Новый пожар #${fire.id} создан`
    });
  }

  // Вспомогательный метод для получения читаемого статуса
  private getReadableStatus(status: string): string {
    switch (status) {
      case 'PENDING': return 'Ожидает обработки';
      case 'IN_PROGRESS': return 'В процессе тушения';
      case 'RESOLVED': return 'Потушен';
      case 'CANCELLED': return 'Отменен';
      default: return status || 'Неизвестно';
    }
  }

  fireUpdated(fire: any) {
    console.log(`[WebSocket] Отправка уведомления об обновлении пожара #${fire.id}`);
    this.server.emit('fireUpdated', fire);
  }

  fireAssigned(data: any) {
    console.log(`[WebSocket] Отправка уведомления о назначении пожара #${data.id || data.fire?.id} для станции ${data.assignedStationId}`);
    console.log(`[WebSocket] Данные для уведомления:`, JSON.stringify(data));
    
    // Сначала отправляем всем, чтобы обновить списки
    this.server.emit('fireUpdated', data.fire || { id: data.id });
    
    // Поддержка множественных назначений: уведомляем только нужную часть
    let clientsNotified = 0;
    
    try {
      // Проверяем все подключенные клиенты
      this.server.sockets.sockets.forEach((client) => {
        console.log(`[WebSocket] Проверяем клиента ${client.id}, данные пользователя:`, 
            JSON.stringify(client.data.user || 'нет данных'));
        
        if (
          client.data.user && 
          client.data.user.role === 'station_dispatcher' && 
          client.data.user.fireStationId === data.assignedStationId
        ) {
          console.log(`[WebSocket] Нашли клиента ${client.id} для станции ${data.assignedStationId}, отправляем персональное уведомление`);
          
          // Подготовим данные о пожаре с полной информацией
          const fireData = {
            ...data.fire,
            // Форматируем информацию об уровне для корректного отображения
            level: {
              name: data.fire?.level?.name || data.fire?.fireLevel?.name || 'Неизвестный уровень',
              id: data.fire?.levelId || data.fire?.fireLevel?.id
            },
            // Добавляем читаемый статус
            readableStatus: this.getReadableStatus(data.fire?.status)
          };
          
          // Отправляем специальное уведомление диспетчеру станции
          client.emit('fireAssigned', { 
            fire: fireData, 
            needsSound: true,
            needsVisualNotification: true,
            message: `Пожар #${data.fire?.id} назначен вашей части!`
          });
          
          clientsNotified++;
        }
      });
      
      console.log(`[WebSocket] Уведомлено клиентов: ${clientsNotified}`);
    } catch (error) {
      console.error('[WebSocket] Ошибка при отправке уведомления о назначении пожара:', error);
    }
  }

  reportCreated(report: any) {
    this.server.emit('reportCreated', report);
  }
} 
