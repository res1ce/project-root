import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class UserService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findByUsername(username: string): Promise<({
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
            content: string;
            userId: number;
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
    }) | null>;
    findById(id: number): Promise<({
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
    } & {
        id: number;
        updatedAt: Date;
        name: string;
        createdAt: Date;
        fireStationId: number | null;
        username: string;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
    }) | null>;
    createUser(dto: CreateUserDto): Promise<{
        id: number;
        updatedAt: Date;
        name: string;
        createdAt: Date;
        fireStationId: number | null;
        username: string;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
    }>;
    countUsers(): Promise<number>;
    getAllUsers(): Promise<({
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
    } & {
        id: number;
        updatedAt: Date;
        name: string;
        createdAt: Date;
        fireStationId: number | null;
        username: string;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
    })[]>;
    updateUser(id: number, dto: any): Promise<{
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
    deleteUser(id: number): Promise<{
        id: number;
        updatedAt: Date;
        name: string;
        createdAt: Date;
        fireStationId: number | null;
        username: string;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
    }>;
}
