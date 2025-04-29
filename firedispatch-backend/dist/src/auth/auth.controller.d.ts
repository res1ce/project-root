import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Request } from 'express';
interface RequestWithUser extends Request {
    user: {
        userId: number;
        username: string;
        role: string;
        fireStationId?: number;
    };
}
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: number;
            username: string;
            role: string;
            fireStationId: number | null;
        };
    }>;
    getProfile(req: RequestWithUser): Promise<{
        userId: number;
        username: string;
        role: string;
        fireStationId: number | undefined;
    }>;
}
export {};
