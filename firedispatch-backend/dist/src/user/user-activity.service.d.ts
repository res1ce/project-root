import { PrismaService } from '../prisma/prisma.service';
export declare class UserActivityService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    logActivity(userId: number, action: string, details?: any, request?: any): Promise<{
        id: number;
        action: string;
        details: string | null;
        timestamp: Date;
        userId: number;
        ipAddress: string | null;
        userAgent: string | null;
    } | null>;
    getUserActivities(userId?: number, action?: string, limit?: number): Promise<({
        user: {
            id: number;
            updatedAt: Date;
            name: string;
            createdAt: Date;
            fireStationId: number | null;
            username: string;
            password: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    } & {
        id: number;
        action: string;
        details: string | null;
        timestamp: Date;
        userId: number;
        ipAddress: string | null;
        userAgent: string | null;
    })[]>;
}
