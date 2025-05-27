import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
export declare class AuthService {
    private readonly userService;
    private readonly jwtService;
    constructor(userService: UserService, jwtService: JwtService);
    validateUser(username: string, password: string): Promise<{
        fireStation: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string;
            latitude: number;
            longitude: number;
            phoneNumber: string | null;
        } | null;
        reports: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            content: string;
            userId: number;
            fireIncidentId: number;
        }[];
    } & {
        id: number;
        username: string;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        fireStationId: number | null;
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
