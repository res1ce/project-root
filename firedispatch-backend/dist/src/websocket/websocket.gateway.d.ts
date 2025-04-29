import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WebsocketService } from './websocket.service';
export declare class WebsocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly websocketService;
    private readonly logger;
    server: Server;
    constructor(websocketService: WebsocketService);
    afterInit(server: Server): void;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinStation(client: Socket, stationId: number): {
        success: boolean;
        stationId: number;
    };
    handleLeaveStation(client: Socket, stationId: number): {
        success: boolean;
        stationId: number;
    };
    handleAuthenticate(client: Socket, userData: {
        userId: number;
        role: string;
    }): {
        success: boolean;
    };
}
