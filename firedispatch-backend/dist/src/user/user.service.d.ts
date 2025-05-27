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
            phoneNumber: string | null;
        } | null;
    } & {
        id: number;
        username: string;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        fireStationId: number | null;
    }) | null>;
    createUser(dto: CreateUserDto): Promise<{
        id: number;
        username: string;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        fireStationId: number | null;
    }>;
    countUsers(): Promise<number>;
    getAllUsers(): Promise<({
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
    } & {
        id: number;
        username: string;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        fireStationId: number | null;
    })[]>;
    updateUser(id: number, dto: any): Promise<{
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
    deleteUser(id: number): Promise<{
        id: number;
        username: string;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        fireStationId: number | null;
    }>;
}
