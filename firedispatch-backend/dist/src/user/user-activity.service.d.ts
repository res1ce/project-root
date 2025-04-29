import { PrismaService } from '../prisma/prisma.service';
export declare class UserActivityService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    logActivity(userId: number, action: string, details?: any, request?: any): Promise<{
        id: number;
        userId: number;
        action: string;
        details: string | null;
        timestamp: Date;
        ipAddress: string | null;
        userAgent: string | null;
    } | null>;
    getUserActivities(userId?: number, action?: string, limit?: number): Promise<({
        user: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            username: string;
            password: string;
            role: import(".prisma/client").$Enums.UserRole;
            fireStationId: number | null;
        };
    } & {
        id: number;
        userId: number;
        action: string;
        details: string | null;
        timestamp: Date;
        ipAddress: string | null;
        userAgent: string | null;
    })[]>;
}
