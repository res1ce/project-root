import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { OnModuleInit } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WebsocketService } from './websocket.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
export declare class WebsocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
    private readonly websocketService;
    private readonly jwtService;
    private readonly configService;
    private readonly logger;
    private clients;
    server: Server;
    constructor(websocketService: WebsocketService, jwtService: JwtService, configService: ConfigService);
    onModuleInit(): void;
    afterInit(server: Server): void;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinStation(client: Socket, stationId: number): {
        success: boolean;
        stationId: number;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        stationId?: undefined;
    };
    handleLeaveStation(client: Socket, stationId: number): {
        success: boolean;
        stationId: number;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        stationId?: undefined;
    };
    handleAuthenticate(client: Socket, userData: {
        userId: number;
        role: string;
    }): {
        success: boolean;
        error: string;
    } | {
        success: boolean;
        error?: undefined;
    };
    handlePing(client: Socket): {
        success: boolean;
        timestamp: Date;
    };
    handleClientAlive(client: Socket, data: any): {
        success: boolean;
        received: boolean;
    };
}
