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
        updatedAt: Date;
        createdAt: Date;
        model: string;
        type: import(".prisma/client").$Enums.VehicleType;
        status: import(".prisma/client").$Enums.VehicleStatus;
        fireStationId: number;
    }>;
    getAll(req: RequestWithUser): Promise<({
        fireStation: {
            id: number;
            updatedAt: Date;
            name: string;
            address: string;
            latitude: number;
            longitude: number;
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
    getById(id: string): Promise<({
        fireStation: {
            id: number;
            updatedAt: Date;
            name: string;
            address: string;
            latitude: number;
            longitude: number;
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
    update(id: string, dto: CreateFireEngineDto, req: RequestWithUser): Promise<{
        id: number;
        updatedAt: Date;
        createdAt: Date;
        model: string;
        type: import(".prisma/client").$Enums.VehicleType;
        status: import(".prisma/client").$Enums.VehicleStatus;
        fireStationId: number;
    }>;
    delete(id: string, req: RequestWithUser): Promise<{
        id: number;
        updatedAt: Date;
        createdAt: Date;
        model: string;
        type: import(".prisma/client").$Enums.VehicleType;
        status: import(".prisma/client").$Enums.VehicleStatus;
        fireStationId: number;
    }>;
}
export {};
