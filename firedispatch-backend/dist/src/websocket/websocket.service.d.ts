import { Server } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
export declare class WebsocketService {
    private prisma;
    private readonly logger;
    private server;
    constructor(prisma: PrismaService);
    setServer(server: Server): void;
    notifyFireStationAboutFire(stationId: number, fireIncidentId: number): Promise<void>;
    sendNotificationToUser(userId: number, notification: any): void;
    sendNotificationToRole(role: string, notification: any): void;
    sendFireStatusUpdate(fireIncidentId: number, status: string): Promise<void>;
}
