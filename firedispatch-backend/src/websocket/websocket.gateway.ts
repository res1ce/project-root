import { 
  WebSocketGateway, 
  WebSocketServer, 
  SubscribeMessage, 
  OnGatewayConnection, 
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
  WsException 
} from '@nestjs/websockets';
import { Logger, Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WebsocketService } from './websocket.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3001', 'http://localhost:3000'],
    credentials: true,
  },
  pingTimeout: 600000, // 10 минут (увеличено)
  pingInterval: 90000, // 1.5 минуты (увеличено)
  transports: ['websocket'],
  allowEIO3: true, 
  cookie: true,
  connectTimeout: 90000, // 90 секунд для установки соединения (увеличено)
  path: '/socket.io/',
  maxHttpBufferSize: 1e8, // 100 MB
  perMessageDeflate: {
    threshold: 1024, // Сжимать сообщения больше 1kb
  }
})
export class WebsocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  private readonly logger = new Logger(WebsocketGateway.name);
  private clients = new Map<string, { userId: number; username: string; role: string }>();

  @WebSocketServer() 
  server: Server;

  constructor(
    private readonly websocketService: WebsocketService,
    @Inject(JwtService) private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  onModuleInit() {
    this.logger.log('WebSocket Gateway Module Initialized');
  }

  afterInit(server: Server) {
    this.websocketService.setServer(server);
    
    // Установить обработчики для сервера
    server.use((socket, next) => {
      // Увеличиваем таймауты на соединении
      // Используем any для доступа к внутренним свойствам
      (socket.conn as any).pingTimeout = 600000; // 10 минут
      
      // Логирование состояния соединения
      this.logger.log(`Client ${socket.id} attempting connection with transport: ${socket.conn.transport.name}`);
      
      // Проверка токена аутентификации
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication token missing'));
        }
        
        const secret = this.configService.get<string>('JWT_SECRET');
        const payload = this.jwtService.verify(token, { secret });
        
        // Сохраняем данные пользователя в контекст сокета
        socket.data.user = payload;
        
        next();
      } catch (error) {
        this.logger.error(`Authentication error: ${error.message}`);
        next(new Error('Authentication failed: ' + error.message));
      }
    });

    // Мониторинг событий самого сервера socket.io
    server.engine.on('connection_error', (err) => {
      this.logger.error(`Socket.io engine connection error: ${err.code} - ${err.message}`, err.stack);
    });
    
    this.logger.log('WebSocket Server Initialized with enhanced settings');
  }

  handleConnection(client: Socket) {
    // Проверяем наличие данных пользователя, установленных middleware
    if (!client.data.user) {
      this.logger.warn(`Client ${client.id} connected without authentication, disconnecting`);
      client.disconnect();
      return;
    }
    
    const { sub: userId, username, role } = client.data.user;
    
    // Регистрируем клиента в нашем Map
    this.clients.set(client.id, { userId, username, role });
    
    this.logger.log(`Client connected: ${client.id} (user: ${username}, role: ${role})`);
    
    // Присоединяем клиента к комнате на основе роли
    client.join(`role_${role}`);
    
    // Присоединяем к комнате пользователя
    client.join(`user_${userId}`);
    
    // Отправляем подтверждение подключения
    client.emit('connection_established', { 
      message: 'Successfully connected to the server',
      timestamp: new Date().toISOString(),
      socketId: client.id,
      userId,
      role
    });
  }

  handleDisconnect(client: Socket) {
    const clientInfo = this.clients.get(client.id);
    
    if (clientInfo) {
      this.logger.log(`Client disconnected: ${client.id} (user: ${clientInfo.username}, role: ${clientInfo.role})`);
      this.clients.delete(client.id);
    } else {
      this.logger.log(`Unknown client disconnected: ${client.id}`);
    }
  }

  @SubscribeMessage('join_station')
  handleJoinStation(@ConnectedSocket() client: Socket, @MessageBody() stationId: number) {
    try {
      if (!client.data.user) {
        this.logger.warn(`Unauthenticated client ${client.id} tried to join station ${stationId}`);
        return { success: false, error: 'Unauthorized' };
      }
      
      client.join(`station_${stationId}`);
      this.logger.log(`Client ${client.id} joined station ${stationId}`);
      return { success: true, stationId };
    } catch (error) {
      this.logger.error(`Error in handleJoinStation: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('leave_station')
  handleLeaveStation(@ConnectedSocket() client: Socket, @MessageBody() stationId: number) {
    try {
      if (!client.data.user) {
        this.logger.warn(`Unauthenticated client ${client.id} tried to leave station ${stationId}`);
        return { success: false, error: 'Unauthorized' };
      }
      
      client.leave(`station_${stationId}`);
      this.logger.log(`Client ${client.id} left station ${stationId}`);
      return { success: true, stationId };
    } catch (error) {
      this.logger.error(`Error in handleLeaveStation: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('authenticate')
  handleAuthenticate(@ConnectedSocket() client: Socket, @MessageBody() userData: { userId: number, role: string }) {
    try {
      const { userId, role } = userData;
      const authUser = client.data.user;
      
      // Проверяем, что пользователь в сокете соответствует тому, кто отправляет данные
      if (!authUser) {
        this.logger.warn(`Client ${client.id} tried to authenticate without valid token`);
        return { success: false, error: 'Authentication failed: No valid token' };
      }
      
      if (authUser.sub !== userId) {
        this.logger.warn(`Client ${client.id} tried to authenticate with mismatched user ID (token: ${authUser.sub}, provided: ${userId})`);
        return { success: false, error: 'Authentication failed: User ID mismatch' };
      }
      
      // Присоединяемся к комнате пользователя
      client.join(`user_${userId}`);
      
      // Присоединяемся к комнате по роли
      client.join(`role_${role}`);
      
      this.logger.log(`Client ${client.id} authenticated as user ${userId} with role ${role}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error in handleAuthenticate: ${error.message}`);
      return { success: false, error: 'Authentication failed: ' + error.message };
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    this.logger.debug(`Received ping from client ${client.id}`);
    return { success: true, timestamp: new Date() };
  }

  @SubscribeMessage('client_alive')
  handleClientAlive(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    const userId = this.clients.get(client.id)?.userId || 'unknown';
    this.logger.debug(`Client alive confirmation from ${client.id} (user: ${userId}) at ${data.timestamp}`);
    return { success: true, received: true };
  }
} 