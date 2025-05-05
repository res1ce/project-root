import { FireStationService } from './fire-station.service';
import { CreateFireStationDto } from './dto/create-fire-station.dto';
interface RequestWithUser extends Request {
    user?: any;
}
export declare class FireStationController {
    private readonly fireStationService;
    constructor(fireStationService: FireStationService);
    create(dto: CreateFireStationDto): Promise<{
        id: number;
        updatedAt: Date;
        name: string;
        address: string;
        latitude: number;
        longitude: number;
        createdAt: Date;
    }>;
    getAll(req: RequestWithUser): Promise<{
        id: number;
        updatedAt: Date;
        name: string;
        address: string;
        latitude: number;
        longitude: number;
        createdAt: Date;
    }[]>;
    getById(id: string): Promise<{
        id: number;
        updatedAt: Date;
        name: string;
        address: string;
        latitude: number;
        longitude: number;
        createdAt: Date;
    } | null>;
    update(id: string, dto: CreateFireStationDto): Promise<{
        id: number;
        updatedAt: Date;
        name: string;
        address: string;
        latitude: number;
        longitude: number;
        createdAt: Date;
    }>;
    delete(id: string): Promise<{
        id: number;
        updatedAt: Date;
        name: string;
        address: string;
        latitude: number;
        longitude: number;
        createdAt: Date;
    }>;
}
export {};
