"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WebsocketGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsocketGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const websocket_service_1 = require("./websocket.service");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
let WebsocketGateway = WebsocketGateway_1 = class WebsocketGateway {
    websocketService;
    jwtService;
    configService;
    logger = new common_1.Logger(WebsocketGateway_1.name);
    clients = new Map();
    server;
    constructor(websocketService, jwtService, configService) {
        this.websocketService = websocketService;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    onModuleInit() {
        this.logger.log('WebSocket Gateway Module Initialized');
    }
    afterInit(server) {
        this.websocketService.setServer(server);
        server.use((socket, next) => {
            socket.conn.pingTimeout = 600000;
            this.logger.log(`Client ${socket.id} attempting connection with transport: ${socket.conn.transport.name}`);
            try {
                const token = socket.handshake.auth.token;
                if (!token) {
                    return next(new Error('Authentication token missing'));
                }
                const secret = this.configService.get('JWT_SECRET');
                const payload = this.jwtService.verify(token, { secret });
                socket.data.user = payload;
                next();
            }
            catch (error) {
                this.logger.error(`Authentication error: ${error.message}`);
                next(new Error('Authentication failed: ' + error.message));
            }
        });
        server.engine.on('connection_error', (err) => {
            this.logger.error(`Socket.io engine connection error: ${err.code} - ${err.message}`, err.stack);
        });
        this.logger.log('WebSocket Server Initialized with enhanced settings');
    }
    handleConnection(client) {
        if (!client.data.user) {
            this.logger.warn(`Client ${client.id} connected without authentication, disconnecting`);
            client.disconnect();
            return;
        }
        const { sub: userId, username, role } = client.data.user;
        this.clients.set(client.id, { userId, username, role });
        this.logger.log(`Client connected: ${client.id} (user: ${username}, role: ${role})`);
        client.join(`role_${role}`);
        client.join(`user_${userId}`);
        client.emit('connection_established', {
            message: 'Successfully connected to the server',
            timestamp: new Date().toISOString(),
            socketId: client.id,
            userId,
            role
        });
    }
    handleDisconnect(client) {
        const clientInfo = this.clients.get(client.id);
        if (clientInfo) {
            this.logger.log(`Client disconnected: ${client.id} (user: ${clientInfo.username}, role: ${clientInfo.role})`);
            this.clients.delete(client.id);
        }
        else {
            this.logger.log(`Unknown client disconnected: ${client.id}`);
        }
    }
    handleJoinStation(client, stationId) {
        try {
            if (!client.data.user) {
                this.logger.warn(`Unauthenticated client ${client.id} tried to join station ${stationId}`);
                return { success: false, error: 'Unauthorized' };
            }
            client.join(`station_${stationId}`);
            this.logger.log(`Client ${client.id} joined station ${stationId}`);
            return { success: true, stationId };
        }
        catch (error) {
            this.logger.error(`Error in handleJoinStation: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    handleLeaveStation(client, stationId) {
        try {
            if (!client.data.user) {
                this.logger.warn(`Unauthenticated client ${client.id} tried to leave station ${stationId}`);
                return { success: false, error: 'Unauthorized' };
            }
            client.leave(`station_${stationId}`);
            this.logger.log(`Client ${client.id} left station ${stationId}`);
            return { success: true, stationId };
        }
        catch (error) {
            this.logger.error(`Error in handleLeaveStation: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    handleAuthenticate(client, userData) {
        try {
            const { userId, role } = userData;
            const authUser = client.data.user;
            if (!authUser) {
                this.logger.warn(`Client ${client.id} tried to authenticate without valid token`);
                return { success: false, error: 'Authentication failed: No valid token' };
            }
            if (authUser.sub !== userId) {
                this.logger.warn(`Client ${client.id} tried to authenticate with mismatched user ID (token: ${authUser.sub}, provided: ${userId})`);
                return { success: false, error: 'Authentication failed: User ID mismatch' };
            }
            client.join(`user_${userId}`);
            client.join(`role_${role}`);
            this.logger.log(`Client ${client.id} authenticated as user ${userId} with role ${role}`);
            return { success: true };
        }
        catch (error) {
            this.logger.error(`Error in handleAuthenticate: ${error.message}`);
            return { success: false, error: 'Authentication failed: ' + error.message };
        }
    }
    handlePing(client) {
        this.logger.debug(`Received ping from client ${client.id}`);
        return { success: true, timestamp: new Date() };
    }
    handleClientAlive(client, data) {
        const userId = this.clients.get(client.id)?.userId || 'unknown';
        this.logger.debug(`Client alive confirmation from ${client.id} (user: ${userId}) at ${data.timestamp}`);
        return { success: true, received: true };
    }
};
exports.WebsocketGateway = WebsocketGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], WebsocketGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_station'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Number]),
    __metadata("design:returntype", void 0)
], WebsocketGateway.prototype, "handleJoinStation", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave_station'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Number]),
    __metadata("design:returntype", void 0)
], WebsocketGateway.prototype, "handleLeaveStation", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('authenticate'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], WebsocketGateway.prototype, "handleAuthenticate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('ping'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], WebsocketGateway.prototype, "handlePing", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('client_alive'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], WebsocketGateway.prototype, "handleClientAlive", null);
exports.WebsocketGateway = WebsocketGateway = WebsocketGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: ['http://localhost:3001', 'http://localhost:3000'],
            credentials: true,
        },
        pingTimeout: 600000,
        pingInterval: 90000,
        transports: ['websocket'],
        allowEIO3: true,
        cookie: true,
        connectTimeout: 90000,
        path: '/socket.io/',
        maxHttpBufferSize: 1e8,
        perMessageDeflate: {
            threshold: 1024,
        }
    }),
    __param(1, (0, common_1.Inject)(jwt_1.JwtService)),
    __metadata("design:paramtypes", [websocket_service_1.WebsocketService,
        jwt_1.JwtService,
        config_1.ConfigService])
], WebsocketGateway);
//# sourceMappingURL=websocket.gateway.js.map