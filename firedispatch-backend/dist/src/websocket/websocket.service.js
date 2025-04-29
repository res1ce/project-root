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
    constructor(prisma) {
        this.prisma = prisma;
    }
    setServer(server) {
        this.server = server;
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
            this.server.to(`station_${stationId}`).emit('new_fire_incident', {
                fireIncident,
                message: 'Новый пожар требует вашего внимания!'
            });
            this.logger.log(`Notification about fire incident ${fireIncidentId} sent to station ${stationId}`);
        }
        catch (error) {
            this.logger.error(`Failed to notify about fire incident: ${error.message}`);
        }
    }
    sendNotificationToUser(userId, notification) {
        this.server.to(`user_${userId}`).emit('notification', notification);
        this.logger.log(`Notification sent to user ${userId}`);
    }
    sendNotificationToRole(role, notification) {
        this.server.to(`role_${role}`).emit('notification', notification);
        this.logger.log(`Notification sent to all users with role ${role}`);
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
                return;
            }
            this.server.to(`station_${fireIncident.fireStationId}`).emit('fire_status_update', {
                fireIncidentId,
                status,
                updatedAt: new Date()
            });
            this.server.to(`role_CENTRAL_DISPATCHER`).emit('fire_status_update', {
                fireIncidentId,
                status,
                updatedAt: new Date()
            });
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
        }
        catch (error) {
            this.logger.error(`Failed to send fire status update: ${error.message}`);
        }
    }
};
exports.WebsocketService = WebsocketService;
exports.WebsocketService = WebsocketService = WebsocketService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WebsocketService);
//# sourceMappingURL=websocket.service.js.map