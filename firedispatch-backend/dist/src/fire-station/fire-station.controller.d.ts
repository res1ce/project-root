import { FireStationService } from './fire-station.service';
import { CreateFireStationDto } from './dto/create-fire-station.dto';
export declare class FireStationController {
    private readonly fireStationService;
    constructor(fireStationService: FireStationService);
    create(dto: CreateFireStationDto): Promise<{
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
    getById(id: string): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        address: string;
        latitude: number;
        longitude: number;
    } | null>;
    update(id: string, dto: CreateFireStationDto): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        address: string;
        latitude: number;
        longitude: number;
    }>;
    delete(id: string): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        address: string;
        latitude: number;
        longitude: number;
    }>;
}
