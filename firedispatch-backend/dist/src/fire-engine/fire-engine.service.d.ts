import { PrismaService } from '../prisma/prisma.service';
import { CreateFireEngineDto } from './dto/create-fire-engine.dto';
export declare class FireEngineService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateFireEngineDto): Promise<{
        id: number;
        updatedAt: Date;
        createdAt: Date;
        model: string;
        type: import(".prisma/client").$Enums.VehicleType;
        status: import(".prisma/client").$Enums.VehicleStatus;
        fireStationId: number;
    }>;
    getAll(): Promise<({
        fireStation: {
            id: number;
            updatedAt: Date;
            name: string;
            address: string;
            latitude: number;
            longitude: number;
            phoneNumber: string | null;
            createdAt: Date;
        };
    } & {
        id: number;
        updatedAt: Date;
        createdAt: Date;
        model: string;
        type: import(".prisma/client").$Enums.VehicleType;
        status: import(".prisma/client").$Enums.VehicleStatus;
        fireStationId: number;
    })[]>;
    getAllByStation(stationId: number): Promise<({
        fireStation: {
            id: number;
            updatedAt: Date;
            name: string;
            address: string;
            latitude: number;
            longitude: number;
            phoneNumber: string | null;
            createdAt: Date;
        };
    } & {
        id: number;
        updatedAt: Date;
        createdAt: Date;
        model: string;
        type: import(".prisma/client").$Enums.VehicleType;
        status: import(".prisma/client").$Enums.VehicleStatus;
        fireStationId: number;
    })[]>;
    getById(id: number): Promise<({
        fireStation: {
            id: number;
            updatedAt: Date;
            name: string;
            address: string;
            latitude: number;
            longitude: number;
            phoneNumber: string | null;
            createdAt: Date;
        };
    } & {
        id: number;
        updatedAt: Date;
        createdAt: Date;
        model: string;
        type: import(".prisma/client").$Enums.VehicleType;
        status: import(".prisma/client").$Enums.VehicleStatus;
        fireStationId: number;
    }) | null>;
    update(id: number, dto: CreateFireEngineDto): Promise<{
        id: number;
        updatedAt: Date;
        createdAt: Date;
        model: string;
        type: import(".prisma/client").$Enums.VehicleType;
        status: import(".prisma/client").$Enums.VehicleStatus;
        fireStationId: number;
    }>;
    delete(id: number): Promise<{
        id: number;
        updatedAt: Date;
        createdAt: Date;
        model: string;
        type: import(".prisma/client").$Enums.VehicleType;
        status: import(".prisma/client").$Enums.VehicleStatus;
        fireStationId: number;
    }>;
    getAllEngineTypes(): Promise<{
        id: number;
        name: "FIRE_TRUCK" | "LADDER_TRUCK" | "RESCUE_VEHICLE" | "WATER_TANKER" | "COMMAND_VEHICLE";
        description: string;
    }[]>;
    private getVehicleTypeDescription;
}
