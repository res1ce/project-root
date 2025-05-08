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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FireEventsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const jwt = require("jsonwebtoken");
let FireEventsGateway = class FireEventsGateway {
    server;
    async handleConnection(client) {
        const token = client.handshake.query?.token;
        if (!token)
            return client.disconnect();
        try {
            const user = jwt.verify(token, process.env.JWT_SECRET || 'supersecret');
            client.data.user = user;
            console.log(`[WebSocket] Клиент подключен: ${client.id}, роль: ${client.data.user?.role}`);
        }
        catch {
            return client.disconnect();
        }
    }
    handleDisconnect(client) {
        console.log(`[WebSocket] Клиент отключен: ${client.id}`);
    }
    fireCreated(fire) {
        console.log(`[WebSocket] Отправка уведомления о создании пожара #${fire.id}`);
        let levelName = 'Неизвестный уровень';
        let levelId = null;
        if (fire.fireLevel) {
            levelName = fire.fireLevel.name;
            levelId = fire.fireLevel.id;
        }
        else if (typeof fire.level === 'object' && fire.level) {
            levelName = fire.level.name;
            levelId = fire.level.id;
        }
        else if (typeof fire.level === 'number') {
            levelName = `Уровень ${fire.level}`;
            levelId = fire.level;
        }
        const readableStatus = this.getReadableStatus(fire.status);
        const fireData = {
            ...fire,
            level: {
                name: levelName,
                id: levelId
            },
            readableStatus
        };
        this.server.emit('fireCreated', {
            fire: fireData,
            needsSound: false,
            needsVisualNotification: true,
            message: `Новый пожар #${fire.id} создан`
        });
    }
    getReadableStatus(status) {
        switch (status) {
            case 'PENDING': return 'Ожидает обработки';
            case 'IN_PROGRESS': return 'В процессе тушения';
            case 'RESOLVED': return 'Потушен';
            case 'CANCELLED': return 'Отменен';
            default: return status || 'Неизвестно';
        }
    }
    fireUpdated(fire) {
        console.log(`[WebSocket] Отправка уведомления об обновлении пожара #${fire.id}`);
        this.server.emit('fireUpdated', fire);
    }
    fireAssigned(data) {
        console.log(`[WebSocket] Отправка уведомления о назначении пожара #${data.id || data.fire?.id} для станции ${data.assignedStationId}`);
        console.log(`[WebSocket] Данные для уведомления:`, JSON.stringify(data));
        this.server.emit('fireUpdated', data.fire || { id: data.id });
        let clientsNotified = 0;
        try {
            this.server.sockets.sockets.forEach((client) => {
                console.log(`[WebSocket] Проверяем клиента ${client.id}, данные пользователя:`, JSON.stringify(client.data.user || 'нет данных'));
                if (client.data.user &&
                    client.data.user.role === 'station_dispatcher' &&
                    client.data.user.fireStationId === data.assignedStationId) {
                    console.log(`[WebSocket] Нашли клиента ${client.id} для станции ${data.assignedStationId}, отправляем персональное уведомление`);
                    const fireData = {
                        ...data.fire,
                        level: {
                            name: data.fire?.level?.name || data.fire?.fireLevel?.name || 'Неизвестный уровень',
                            id: data.fire?.levelId || data.fire?.fireLevel?.id
                        },
                        readableStatus: this.getReadableStatus(data.fire?.status)
                    };
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
        }
        catch (error) {
            console.error('[WebSocket] Ошибка при отправке уведомления о назначении пожара:', error);
        }
    }
    reportCreated(report) {
        this.server.emit('reportCreated', report);
    }
};
exports.FireEventsGateway = FireEventsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], FireEventsGateway.prototype, "server", void 0);
exports.FireEventsGateway = FireEventsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: ['http://localhost:3001', 'http://localhost:3000'],
            credentials: true
        },
        path: '/fire-events/socket.io',
        namespace: '/fire-events',
        transports: ['websocket'],
        connectTimeout: 60000,
    })
], FireEventsGateway);
//# sourceMappingURL=fire-events.gateway.js.map