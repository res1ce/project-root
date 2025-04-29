import { UserRole } from '@prisma/client';
export declare class CreateUserDto {
    username: string;
    password: string;
    role: UserRole;
    name?: string;
    fireStationId?: number;
}
