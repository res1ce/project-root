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
        updatedAt: Date;
        name: string;
        createdAt: Date;
        fireStationId: number | null;
        username: string;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
    }>;
    getUserActivities(userId?: string, action?: string, limit?: string): Promise<({
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
    getUserActivityById(id: string): Promise<({
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
    getActivityStats(): Promise<{
        stats: Record<string, number>;
        totalUsers: number;
        activityToday: number;
        totalActivity: number;
    }>;
}
export {};
