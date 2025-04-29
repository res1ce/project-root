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
let WebsocketGateway = WebsocketGateway_1 = class WebsocketGateway {
    websocketService;
    logger = new common_1.Logger(WebsocketGateway_1.name);
    server;
    constructor(websocketService) {
        this.websocketService = websocketService;
    }
    afterInit(server) {
        this.websocketService.setServer(server);
        this.logger.log('WebSocket Server Initialized');
    }
    handleConnection(client) {
        this.logger.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    handleJoinStation(client, stationId) {
        client.join(`station_${stationId}`);
        this.logger.log(`Client ${client.id} joined station ${stationId}`);
        return { success: true, stationId };
    }
    handleLeaveStation(client, stationId) {
        client.leave(`station_${stationId}`);
        this.logger.log(`Client ${client.id} left station ${stationId}`);
        return { success: true, stationId };
    }
    handleAuthenticate(client, userData) {
        const { userId, role } = userData;
        client.data.userId = userId;
        client.data.role = role;
        client.join(`user_${userId}`);
        client.join(`role_${role}`);
        this.logger.log(`Client ${client.id} authenticated as user ${userId} with role ${role}`);
        return { success: true };
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
exports.WebsocketGateway = WebsocketGateway = WebsocketGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    }),
    __metadata("design:paramtypes", [websocket_service_1.WebsocketService])
], WebsocketGateway);
//# sourceMappingURL=websocket.gateway.js.map