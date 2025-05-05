import { PrismaService } from '../prisma/prisma.service';
import { CreateFireStationDto } from './dto/create-fire-station.dto';
import { UserRole } from '@prisma/client';
export declare class FireStationService {
    private prisma;
    constructor(prisma: PrismaService);
    createFireStation(dto: CreateFireStationDto): Promise<{
        id: number;
        updatedAt: Date;
        name: string;
        address: string;
        latitude: number;
        longitude: number;
        createdAt: Date;
    }>;
    getAll(userId?: number, userRole?: UserRole | string): Promise<{
        id: number;
        updatedAt: Date;
        name: string;
        address: string;
        latitude: number;
        longitude: number;
        createdAt: Date;
    }[]>;
    getById(id: number): Promise<{
        id: number;
        updatedAt: Date;
        name: string;
        address: string;
        latitude: number;
        longitude: number;
        createdAt: Date;
    } | null>;
    update(id: number, dto: CreateFireStationDto): Promise<{
        id: number;
        updatedAt: Date;
        name: string;
        address: string;
        latitude: number;
        longitude: number;
        createdAt: Date;
    }>;
    delete(id: number): Promise<{
        id: number;
        updatedAt: Date;
        name: string;
        address: string;
        latitude: number;
        longitude: number;
        createdAt: Date;
    }>;
}
