import { FireService } from './fire.service';
import { CreateFireDto } from './dto/create-fire.dto';
import { ChangeFireLevelDto } from './dto/change-fire-level.dto';
import { UserActivityService } from '../user/user-activity.service';
import { Request } from 'express';
import { CreateFireLevelDto } from './dto/create-firelevel.dto';
import { CreateFireLevelRequirementDto } from './dto/create-firelevel-requirement.dto';
import { CreateAddressLevelDto } from './dto/create-address-level.dto';
interface RequestWithUser extends Request {
    user?: any;
}
export declare class FireController {
    private readonly fireService;
    private readonly userActivityService;
    constructor(fireService: FireService, userActivityService: UserActivityService);
    create(dto: CreateFireDto, req: RequestWithUser): Promise<{
        assignedVehicles: {
            id: number;
            status: import(".prisma/client").$Enums.VehicleStatus;
            createdAt: Date;
            updatedAt: Date;
            fireStationId: number;
            model: string;
            type: import(".prisma/client").$Enums.VehicleType;
        }[];
        reportedBy: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            fireStationId: number | null;
            username: string;
            password: string;
            role: import(".prisma/client").$Enums.UserRole;
            name: string;
        };
        assignedTo: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            fireStationId: number | null;
            username: string;
            password: string;
            role: import(".prisma/client").$Enums.UserRole;
            name: string;
        };
        fireStation: {
            id: number;
            latitude: number;
            longitude: number;
            createdAt: Date;
            updatedAt: Date;
            address: string;
            name: string;
        };
        fireLevel: {
            id: number;
            description: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            level: number;
        };
        id: number;
        latitude: number;
        longitude: number;
        status: import(".prisma/client").$Enums.IncidentStatus;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        resolvedAt: Date | null;
        address: string | null;
        reportedById: number;
        assignedToId: number;
        fireStationId: number;
        fireLevelId: number;
    }>;
    getAll(req: RequestWithUser): Promise<{
        readableStatus: string;
        reportedBy: {
            id: number;
            role: import(".prisma/client").$Enums.UserRole;
            name: string;
        };
        assignedTo: {
            id: number;
            role: import(".prisma/client").$Enums.UserRole;
            name: string;
        };
        fireStation: {
            id: number;
            latitude: number;
            longitude: number;
            createdAt: Date;
            updatedAt: Date;
            address: string;
            name: string;
        };
        fireLevel: {
            id: number;
            description: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            level: number;
        };
        vehicles: {
            id: number;
            status: import(".prisma/client").$Enums.VehicleStatus;
            createdAt: Date;
            updatedAt: Date;
            fireStationId: number;
            model: string;
            type: import(".prisma/client").$Enums.VehicleType;
        }[];
        reports: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            content: string;
            userId: number;
            fireIncidentId: number;
        }[];
        id: number;
        latitude: number;
        longitude: number;
        status: import(".prisma/client").$Enums.IncidentStatus;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        resolvedAt: Date | null;
        address: string | null;
        reportedById: number;
        assignedToId: number;
        fireStationId: number;
        fireLevelId: number;
    }[]>;
    getById(id: string): Promise<{
        readableStatus: string;
        reportedBy: {
            id: number;
            role: import(".prisma/client").$Enums.UserRole;
            name: string;
        };
        assignedTo: {
            id: number;
            role: import(".prisma/client").$Enums.UserRole;
            name: string;
        };
        fireStation: {
            id: number;
            latitude: number;
            longitude: number;
            createdAt: Date;
            updatedAt: Date;
            address: string;
            name: string;
        };
        fireLevel: {
            requirements: {
                id: number;
                createdAt: Date;
                updatedAt: Date;
                fireLevelId: number;
                count: number;
                vehicleType: import(".prisma/client").$Enums.VehicleType;
            }[];
        } & {
            id: number;
            description: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            level: number;
        };
        vehicles: {
            id: number;
            status: import(".prisma/client").$Enums.VehicleStatus;
            createdAt: Date;
            updatedAt: Date;
            fireStationId: number;
            model: string;
            type: import(".prisma/client").$Enums.VehicleType;
        }[];
        reports: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            content: string;
            userId: number;
            fireIncidentId: number;
        }[];
        id: number;
        latitude: number;
        longitude: number;
        status: import(".prisma/client").$Enums.IncidentStatus;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        resolvedAt: Date | null;
        address: string | null;
        reportedById: number;
        assignedToId: number;
        fireStationId: number;
        fireLevelId: number;
    }>;
    update(id: string, dto: CreateFireDto, req: RequestWithUser): Promise<{
        reportedBy: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            fireStationId: number | null;
            username: string;
            password: string;
            role: import(".prisma/client").$Enums.UserRole;
            name: string;
        };
        assignedTo: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            fireStationId: number | null;
            username: string;
            password: string;
            role: import(".prisma/client").$Enums.UserRole;
            name: string;
        };
        fireStation: {
            id: number;
            latitude: number;
            longitude: number;
            createdAt: Date;
            updatedAt: Date;
            address: string;
            name: string;
        };
        fireLevel: {
            id: number;
            description: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            level: number;
        };
        vehicles: {
            id: number;
            status: import(".prisma/client").$Enums.VehicleStatus;
            createdAt: Date;
            updatedAt: Date;
            fireStationId: number;
            model: string;
            type: import(".prisma/client").$Enums.VehicleType;
        }[];
    } & {
        id: number;
        latitude: number;
        longitude: number;
        status: import(".prisma/client").$Enums.IncidentStatus;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        resolvedAt: Date | null;
        address: string | null;
        reportedById: number;
        assignedToId: number;
        fireStationId: number;
        fireLevelId: number;
    }>;
    delete(id: string): Promise<{
        id: number;
        latitude: number;
        longitude: number;
        status: import(".prisma/client").$Enums.IncidentStatus;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        resolvedAt: Date | null;
        address: string | null;
        reportedById: number;
        assignedToId: number;
        fireStationId: number;
        fireLevelId: number;
    }>;
    getAssignments(id: string): Promise<{
        id: number;
        status: import(".prisma/client").$Enums.VehicleStatus;
        createdAt: Date;
        updatedAt: Date;
        fireStationId: number;
        model: string;
        type: import(".prisma/client").$Enums.VehicleType;
    }[]>;
    getFireHistory(id: string): Promise<({
        user: {
            id: number;
            username: string;
            role: import(".prisma/client").$Enums.UserRole;
            name: string;
        };
    } & {
        id: number;
        userId: number;
        action: string;
        details: string | null;
        timestamp: Date;
        ipAddress: string | null;
        userAgent: string | null;
    })[]>;
    getAllRequirements(): Promise<({
        fireLevel: {
            id: number;
            description: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            level: number;
        };
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        fireLevelId: number;
        count: number;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
    })[]>;
    getRequirementById(id: string): Promise<{
        fireLevel: {
            id: number;
            description: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            level: number;
        };
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        fireLevelId: number;
        count: number;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
    }>;
    createRequirement(dto: CreateFireLevelRequirementDto): Promise<{
        fireLevel: {
            id: number;
            description: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            level: number;
        };
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        fireLevelId: number;
        count: number;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
    }>;
    updateRequirement(id: string, dto: CreateFireLevelRequirementDto): Promise<{
        fireLevel: {
            id: number;
            description: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            level: number;
        };
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        fireLevelId: number;
        count: number;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
    }>;
    deleteRequirement(id: string): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        fireLevelId: number;
        count: number;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
    }>;
    getAllLevels(): Promise<({
        requirements: {
            id: number;
            count: number;
            vehicleType: import(".prisma/client").$Enums.VehicleType;
        }[];
    } & {
        id: number;
        description: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        level: number;
    })[]>;
    getLevelById(id: string): Promise<{
        requirements: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            fireLevelId: number;
            count: number;
            vehicleType: import(".prisma/client").$Enums.VehicleType;
        }[];
    } & {
        id: number;
        description: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        level: number;
    }>;
    createLevel(dto: CreateFireLevelDto): Promise<{
        id: number;
        description: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        level: number;
    }>;
    updateLevel(id: string, dto: CreateFireLevelDto): Promise<{
        id: number;
        description: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        level: number;
    }>;
    deleteLevel(id: string): Promise<{
        id: number;
        description: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        level: number;
    }>;
    changeFireLevel(id: string, dto: ChangeFireLevelDto, req: RequestWithUser): Promise<{
        fireLevel: {
            id: number;
            description: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            level: number;
        };
    } & {
        id: number;
        latitude: number;
        longitude: number;
        status: import(".prisma/client").$Enums.IncidentStatus;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        resolvedAt: Date | null;
        address: string | null;
        reportedById: number;
        assignedToId: number;
        fireStationId: number;
        fireLevelId: number;
    }>;
    getAllAddressLevels(): Promise<({
        fireLevel: {
            id: number;
            description: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            level: number;
        };
    } & {
        id: number;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        address: string;
        fireLevelId: number;
    })[]>;
    getAddressLevelById(id: string): Promise<{
        fireLevel: {
            id: number;
            description: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            level: number;
        };
    } & {
        id: number;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        address: string;
        fireLevelId: number;
    }>;
    createAddressLevel(dto: CreateAddressLevelDto): Promise<{
        fireLevel: {
            id: number;
            description: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            level: number;
        };
    } & {
        id: number;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        address: string;
        fireLevelId: number;
    }>;
    updateAddressLevel(id: string, dto: CreateAddressLevelDto): Promise<{
        fireLevel: {
            id: number;
            description: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            level: number;
        };
    } & {
        id: number;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        address: string;
        fireLevelId: number;
    }>;
    deleteAddressLevel(id: string): Promise<{
        id: number;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        address: string;
        fireLevelId: number;
    }>;
    resolveFire(id: string, req: RequestWithUser): Promise<{
        fireStation: {
            id: number;
            latitude: number;
            longitude: number;
            createdAt: Date;
            updatedAt: Date;
            address: string;
            name: string;
        };
        fireLevel: {
            id: number;
            description: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            level: number;
        };
    } & {
        id: number;
        latitude: number;
        longitude: number;
        status: import(".prisma/client").$Enums.IncidentStatus;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        resolvedAt: Date | null;
        address: string | null;
        reportedById: number;
        assignedToId: number;
        fireStationId: number;
        fireLevelId: number;
    }>;
}
export {};
