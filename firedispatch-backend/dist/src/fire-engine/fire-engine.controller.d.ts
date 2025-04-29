import { FireEngineService } from './fire-engine.service';
import { CreateFireEngineDto } from './dto/create-fire-engine.dto';
import { Request } from 'express';
interface RequestWithUser extends Request {
    user?: any;
}
export declare class FireEngineController {
    private readonly fireEngineService;
    constructor(fireEngineService: FireEngineService);
    create(dto: CreateFireEngineDto, req: RequestWithUser): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        fireStationId: number;
        model: string;
        type: import(".prisma/client").$Enums.VehicleType;
        status: import(".prisma/client").$Enums.VehicleStatus;
    }>;
    getAll(req: RequestWithUser): Promise<({
        fireStation: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string;
            latitude: number;
            longitude: number;
        };
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        fireStationId: number;
        model: string;
        type: import(".prisma/client").$Enums.VehicleType;
        status: import(".prisma/client").$Enums.VehicleStatus;
    })[]>;
    getById(id: string): Promise<({
        fireStation: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string;
            latitude: number;
            longitude: number;
        };
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        fireStationId: number;
        model: string;
        type: import(".prisma/client").$Enums.VehicleType;
        status: import(".prisma/client").$Enums.VehicleStatus;
    }) | null>;
    update(id: string, dto: CreateFireEngineDto, req: RequestWithUser): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        fireStationId: number;
        model: string;
        type: import(".prisma/client").$Enums.VehicleType;
        status: import(".prisma/client").$Enums.VehicleStatus;
    }>;
    delete(id: string, req: RequestWithUser): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        fireStationId: number;
        model: string;
        type: import(".prisma/client").$Enums.VehicleType;
        status: import(".prisma/client").$Enums.VehicleStatus;
    }>;
}
export {};
