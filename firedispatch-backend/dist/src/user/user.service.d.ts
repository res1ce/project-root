import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class UserService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findByUsername(username: string): Promise<({
        fireStation: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string;
            latitude: number;
            longitude: number;
        } | null;
        reports: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            userId: number;
            fireIncidentId: number;
            content: string;
        }[];
    } & {
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        username: string;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
        fireStationId: number | null;
    }) | null>;
    findById(id: number): Promise<({
        fireStation: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string;
            latitude: number;
            longitude: number;
        } | null;
    } & {
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        username: string;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
        fireStationId: number | null;
    }) | null>;
    createUser(dto: CreateUserDto): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        username: string;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
        fireStationId: number | null;
    }>;
    countUsers(): Promise<number>;
}
