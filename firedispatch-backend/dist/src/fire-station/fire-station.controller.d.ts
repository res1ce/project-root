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
        phoneNumber: string | null;
        createdAt: Date;
    }>;
    getAll(req: RequestWithUser): Promise<{
        id: number;
        updatedAt: Date;
        name: string;
        address: string;
        latitude: number;
        longitude: number;
        phoneNumber: string | null;
        createdAt: Date;
    }[]>;
    getById(id: string): Promise<{
        id: number;
        updatedAt: Date;
        name: string;
        address: string;
        latitude: number;
        longitude: number;
        phoneNumber: string | null;
        createdAt: Date;
    } | null>;
    update(id: string, dto: CreateFireStationDto): Promise<{
        id: number;
        updatedAt: Date;
        name: string;
        address: string;
        latitude: number;
        longitude: number;
        phoneNumber: string | null;
        createdAt: Date;
    }>;
    delete(id: string): Promise<{
        id: number;
        updatedAt: Date;
        name: string;
        address: string;
        latitude: number;
        longitude: number;
        phoneNumber: string | null;
        createdAt: Date;
    }>;
}
export {};
