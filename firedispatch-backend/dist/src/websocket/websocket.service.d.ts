import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Server } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
export declare class WebsocketService implements OnModuleInit, OnModuleDestroy {
    private prisma;
    private readonly logger;
    private server;
    private keepAliveInterval;
    constructor(prisma: PrismaService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    setServer(server: Server): void;
    private startKeepAlive;
    notifyFireStationAboutFire(stationId: number, fireIncidentId: number): Promise<{
        success: boolean;
        recipientsCount: number;
        sentAt: Date;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        recipientsCount?: undefined;
        sentAt?: undefined;
    } | undefined>;
    sendNotificationToUser(userId: number, notification: any): {
        success: boolean;
        recipientsCount: number;
        sentAt: Date;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        recipientsCount?: undefined;
        sentAt?: undefined;
    };
    sendNotificationToRole(role: string, notification: any): {
        success: boolean;
        recipientsCount: number;
        sentAt: Date;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        recipientsCount?: undefined;
        sentAt?: undefined;
    };
    sendFireStatusUpdate(fireIncidentId: number, status: string): Promise<{
        success: boolean;
        sentAt: Date;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        sentAt?: undefined;
    }>;
    getConnectionsInfo(): {
        connected: boolean;
        totalConnections: number;
        rooms: {
            name: string;
            connections: number;
        }[];
    };
}
