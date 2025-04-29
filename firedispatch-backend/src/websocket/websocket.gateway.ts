import { 
  WebSocketGateway, 
  WebSocketServer, 
  SubscribeMessage, 
  OnGatewayConnection, 
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody 
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WebsocketService } from './websocket.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WebsocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(WebsocketGateway.name);

  @WebSocketServer() 
  server: Server;

  constructor(private readonly websocketService: WebsocketService) {}

  afterInit(server: Server) {
    this.websocketService.setServer(server);
    this.logger.log('WebSocket Server Initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_station')
  handleJoinStation(@ConnectedSocket() client: Socket, @MessageBody() stationId: number) {
    client.join(`station_${stationId}`);
    this.logger.log(`Client ${client.id} joined station ${stationId}`);
    return { success: true, stationId };
  }

  @SubscribeMessage('leave_station')
  handleLeaveStation(@ConnectedSocket() client: Socket, @MessageBody() stationId: number) {
    client.leave(`station_${stationId}`);
    this.logger.log(`Client ${client.id} left station ${stationId}`);
    return { success: true, stationId };
  }

  @SubscribeMessage('authenticate')
  handleAuthenticate(@ConnectedSocket() client: Socket, @MessageBody() userData: { userId: number, role: string }) {
    const { userId, role } = userData;
    
    // Store user data in socket
    client.data.userId = userId;
    client.data.role = role;
    
    // Join user-specific room
    client.join(`user_${userId}`);
    
    // Join role-specific room
    client.join(`role_${role}`);
    
    this.logger.log(`Client ${client.id} authenticated as user ${userId} with role ${role}`);
    return { success: true };
  }
} 