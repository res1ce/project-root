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
        }
        catch {
            return client.disconnect();
        }
    }
    handleDisconnect(client) { }
    fireCreated(fire) {
        this.server.emit('fireCreated', { ...fire, needsSound: false });
    }
    fireUpdated(fire) {
        this.server.emit('fireUpdated', fire);
    }
    fireAssigned(fire) {
        this.server.sockets.sockets.forEach((client) => {
            if (client.data.user?.role === 'station_dispatcher' &&
                client.data.user?.fireStationId === fire.assignedStationId) {
                client.emit('fireAssigned', { ...fire, needsSound: true });
            }
        });
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
        }
    })
], FireEventsGateway);
//# sourceMappingURL=fire-events.gateway.js.map