import { PrismaService } from '../prisma/prisma.service';
import { CreateFireStationDto } from './dto/create-fire-station.dto';
export declare class FireStationService {
    private prisma;
    constructor(prisma: PrismaService);
    createFireStation(dto: CreateFireStationDto): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        address: string;
        latitude: number;
        longitude: number;
    }>;
    getAll(): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        address: string;
        latitude: number;
        longitude: number;
    }[]>;
    getById(id: number): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        address: string;
        latitude: number;
        longitude: number;
    } | null>;
    update(id: number, dto: CreateFireStationDto): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        address: string;
        latitude: number;
        longitude: number;
    }>;
    delete(id: number): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        address: string;
        latitude: number;
        longitude: number;
    }>;
}
