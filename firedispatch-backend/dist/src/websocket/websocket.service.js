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
var WebsocketService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsocketService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let WebsocketService = WebsocketService_1 = class WebsocketService {
    prisma;
    logger = new common_1.Logger(WebsocketService_1.name);
    server;
    keepAliveInterval;
    constructor(prisma) {
        this.prisma = prisma;
    }
    onModuleInit() {
        this.logger.log('WebSocket Service initialized');
    }
    onModuleDestroy() {
        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
            this.logger.log('KeepAlive service stopped');
        }
    }
    setServer(server) {
        this.server = server;
        this.logger.log('WebSocket server instance set in WebsocketService');
        this.startKeepAlive();
    }
    startKeepAlive() {
        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
        }
        this.keepAliveInterval = setInterval(() => {
            if (!this.server)
                return;
            try {
                const connectedClients = this.server.sockets.sockets.size;
                if (connectedClients > 0) {
                    this.server.emit('server_keepalive', { timestamp: new Date(), message: 'Server is alive' });
                    this.logger.debug(`Sent keepalive to ${connectedClients} clients`);
                }
            }
            catch (error) {
                this.logger.error(`Error sending keepalive: ${error.message}`);
            }
        }, 60000);
        this.logger.log('KeepAlive service started with 60s interval');
    }
    async notifyFireStationAboutFire(stationId, fireIncidentId) {
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
            const room = this.server.sockets.adapter.rooms.get(`station_${stationId}`);
            if (!room || room.size === 0) {
                this.logger.warn(`No connected clients in station_${stationId} room, notification may be missed`);
            }
            this.server.to(`station_${stationId}`).emit('new_fire_incident', {
                fireIncident,
                message: 'Новый пожар требует вашего внимания!'
            });
            this.logger.log(`Notification about fire incident ${fireIncidentId} sent to station ${stationId}`);
            return {
                success: true,
                recipientsCount: room?.size || 0,
                sentAt: new Date()
            };
        }
        catch (error) {
            this.logger.error(`Failed to notify about fire incident: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }
    sendNotificationToUser(userId, notification) {
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
        }
        catch (error) {
            this.logger.error(`Failed to send notification to user ${userId}: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }
    sendNotificationToRole(role, notification) {
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
        }
        catch (error) {
            this.logger.error(`Failed to send notification to role ${role}: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }
    async sendFireStatusUpdate(fireIncidentId, status) {
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
            const updateData = {
                fireIncidentId,
                status,
                updatedAt: new Date()
            };
            this.server.to(`station_${fireIncident.fireStationId}`).emit('fire_status_update', updateData);
            this.server.to(`role_CENTRAL_DISPATCHER`).emit('fire_status_update', updateData);
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
        }
        catch (error) {
            this.logger.error(`Failed to send fire status update: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }
    getConnectionsInfo() {
        if (!this.server) {
            return {
                connected: false,
                totalConnections: 0,
                rooms: []
            };
        }
        const totalConnections = this.server.sockets.sockets.size;
        const rooms = [];
        this.server.sockets.adapter.rooms.forEach((sockets, roomName) => {
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
};
exports.WebsocketService = WebsocketService;
exports.WebsocketService = WebsocketService = WebsocketService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WebsocketService);
//# sourceMappingURL=websocket.service.js.map