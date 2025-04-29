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
  } 
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
    } catch {
      return client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {}

  fireCreated(fire: any) {
    this.server.emit('fireCreated', { ...fire, needsSound: false });
  }

  fireUpdated(fire: any) {
    this.server.emit('fireUpdated', fire);
  }

  fireAssigned(fire: any) {
    // Поддержка множественных назначений: уведомляем только нужную часть
    this.server.sockets.sockets.forEach((client) => {
      if (
        client.data.user?.role === 'station_dispatcher' &&
        client.data.user?.fireStationId === fire.assignedStationId
      ) {
        client.emit('fireAssigned', { ...fire, needsSound: true });
      }
    });
  }

  reportCreated(report: any) {
    this.server.emit('reportCreated', report);
  }
} 