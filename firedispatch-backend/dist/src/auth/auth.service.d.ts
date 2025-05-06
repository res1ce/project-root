import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
export declare class AuthService {
    private readonly userService;
    private readonly jwtService;
    constructor(userService: UserService, jwtService: JwtService);
    validateUser(username: string, password: string): Promise<{
        fireStation: {
            id: number;
            updatedAt: Date;
            name: string;
            address: string;
            latitude: number;
            longitude: number;
            phoneNumber: string | null;
            createdAt: Date;
        } | null;
        reports: {
            id: number;
            updatedAt: Date;
            createdAt: Date;
            fireIncidentId: number;
            userId: number;
            content: string;
        }[];
    } & {
        id: number;
        updatedAt: Date;
        name: string;
        createdAt: Date;
        fireStationId: number | null;
        username: string;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
    }>;
    login(username: string, password: string): Promise<{
        access_token: string;
        user: {
            id: number;
            username: string;
            role: string;
            fireStationId: number | null;
        };
    }>;
}
