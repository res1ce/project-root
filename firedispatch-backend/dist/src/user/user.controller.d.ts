import { Request } from 'express';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';
import { UserActivityService } from './user-activity.service';
interface RequestWithUser extends Request {
    user?: any;
}
export declare class UserController {
    private readonly userService;
    private readonly userActivityService;
    constructor(userService: UserService, userActivityService: UserActivityService);
    getMe(req: RequestWithUser): any;
    adminOnly(req: RequestWithUser): {
        message: string;
        user: any;
    };
    createUser(dto: CreateUserDto, req: RequestWithUser): Promise<{
        id: number;
        username: string;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        fireStationId: number | null;
    }>;
    getUserActivities(userId?: string, action?: string, limit?: string): Promise<({
        user: {
            id: number;
            username: string;
            password: string;
            role: import(".prisma/client").$Enums.UserRole;
            name: string;
            createdAt: Date;
            updatedAt: Date;
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
    getUserActivityById(id: string): Promise<({
        user: {
            id: number;
            username: string;
            password: string;
            role: import(".prisma/client").$Enums.UserRole;
            name: string;
            createdAt: Date;
            updatedAt: Date;
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
    getActivityStats(): Promise<{
        stats: Record<string, number>;
        totalUsers: number;
        activityToday: number;
        totalActivity: number;
    }>;
}
export {};
