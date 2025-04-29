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
            createdAt: Date;
            updatedAt: Date;
            fireStationId: number;
            model: string;
            type: import(".prisma/client").$Enums.VehicleType;
            status: import(".prisma/client").$Enums.VehicleStatus;
        }[];
        fireLevel: {
            id: number;
            level: number;
            name: string;
            description: string;
            createdAt: Date;
            updatedAt: Date;
        };
        fireStation: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string;
            latitude: number;
            longitude: number;
        };
        reportedBy: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            username: string;
            password: string;
            role: import(".prisma/client").$Enums.UserRole;
            fireStationId: number | null;
        };
        assignedTo: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            username: string;
            password: string;
            role: import(".prisma/client").$Enums.UserRole;
            fireStationId: number | null;
        };
        id: number;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        fireLevelId: number;
        address: string | null;
        latitude: number;
        longitude: number;
        fireStationId: number;
        status: import(".prisma/client").$Enums.IncidentStatus;
        reportedById: number;
        assignedToId: number;
        resolvedAt: Date | null;
    }>;
    getAll(): Promise<({
        fireLevel: {
            id: number;
            level: number;
            name: string;
            description: string;
            createdAt: Date;
            updatedAt: Date;
        };
        fireStation: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string;
            latitude: number;
            longitude: number;
        };
        vehicles: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            fireStationId: number;
            model: string;
            type: import(".prisma/client").$Enums.VehicleType;
            status: import(".prisma/client").$Enums.VehicleStatus;
        }[];
        reports: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            userId: number;
            fireIncidentId: number;
            content: string;
        }[];
        reportedBy: {
            id: number;
            name: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
        assignedTo: {
            id: number;
            name: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    } & {
        id: number;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        fireLevelId: number;
        address: string | null;
        latitude: number;
        longitude: number;
        fireStationId: number;
        status: import(".prisma/client").$Enums.IncidentStatus;
        reportedById: number;
        assignedToId: number;
        resolvedAt: Date | null;
    })[]>;
    getById(id: string): Promise<{
        fireLevel: {
            requirements: {
                id: number;
                createdAt: Date;
                updatedAt: Date;
                count: number;
                fireLevelId: number;
                vehicleType: import(".prisma/client").$Enums.VehicleType;
            }[];
        } & {
            id: number;
            level: number;
            name: string;
            description: string;
            createdAt: Date;
            updatedAt: Date;
        };
        fireStation: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string;
            latitude: number;
            longitude: number;
        };
        vehicles: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            fireStationId: number;
            model: string;
            type: import(".prisma/client").$Enums.VehicleType;
            status: import(".prisma/client").$Enums.VehicleStatus;
        }[];
        reports: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            userId: number;
            fireIncidentId: number;
            content: string;
        }[];
        reportedBy: {
            id: number;
            name: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
        assignedTo: {
            id: number;
            name: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    } & {
        id: number;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        fireLevelId: number;
        address: string | null;
        latitude: number;
        longitude: number;
        fireStationId: number;
        status: import(".prisma/client").$Enums.IncidentStatus;
        reportedById: number;
        assignedToId: number;
        resolvedAt: Date | null;
    }>;
    update(id: string, dto: CreateFireDto, req: RequestWithUser): Promise<{
        fireLevel: {
            id: number;
            level: number;
            name: string;
            description: string;
            createdAt: Date;
            updatedAt: Date;
        };
        fireStation: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string;
            latitude: number;
            longitude: number;
        };
        vehicles: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            fireStationId: number;
            model: string;
            type: import(".prisma/client").$Enums.VehicleType;
            status: import(".prisma/client").$Enums.VehicleStatus;
        }[];
        reportedBy: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            username: string;
            password: string;
            role: import(".prisma/client").$Enums.UserRole;
            fireStationId: number | null;
        };
        assignedTo: {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            username: string;
            password: string;
            role: import(".prisma/client").$Enums.UserRole;
            fireStationId: number | null;
        };
    } & {
        id: number;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        fireLevelId: number;
        address: string | null;
        latitude: number;
        longitude: number;
        fireStationId: number;
        status: import(".prisma/client").$Enums.IncidentStatus;
        reportedById: number;
        assignedToId: number;
        resolvedAt: Date | null;
    }>;
    delete(id: string): Promise<{
        id: number;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        fireLevelId: number;
        address: string | null;
        latitude: number;
        longitude: number;
        fireStationId: number;
        status: import(".prisma/client").$Enums.IncidentStatus;
        reportedById: number;
        assignedToId: number;
        resolvedAt: Date | null;
    }>;
    getAssignments(id: string): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        fireStationId: number;
        model: string;
        type: import(".prisma/client").$Enums.VehicleType;
        status: import(".prisma/client").$Enums.VehicleStatus;
    }[]>;
    getFireHistory(id: string): Promise<({
        user: {
            id: number;
            name: string;
            username: string;
            role: import(".prisma/client").$Enums.UserRole;
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
            level: number;
            name: string;
            description: string;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        count: number;
        fireLevelId: number;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
    })[]>;
    getRequirementById(id: string): Promise<{
        fireLevel: {
            id: number;
            level: number;
            name: string;
            description: string;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        count: number;
        fireLevelId: number;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
    }>;
    createRequirement(dto: CreateFireLevelRequirementDto): Promise<{
        fireLevel: {
            id: number;
            level: number;
            name: string;
            description: string;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        count: number;
        fireLevelId: number;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
    }>;
    updateRequirement(id: string, dto: CreateFireLevelRequirementDto): Promise<{
        fireLevel: {
            id: number;
            level: number;
            name: string;
            description: string;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        count: number;
        fireLevelId: number;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
    }>;
    deleteRequirement(id: string): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        count: number;
        fireLevelId: number;
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
        level: number;
        name: string;
        description: string;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    getLevelById(id: string): Promise<{
        requirements: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            count: number;
            fireLevelId: number;
            vehicleType: import(".prisma/client").$Enums.VehicleType;
        }[];
    } & {
        id: number;
        level: number;
        name: string;
        description: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createLevel(dto: CreateFireLevelDto): Promise<{
        id: number;
        level: number;
        name: string;
        description: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateLevel(id: string, dto: CreateFireLevelDto): Promise<{
        id: number;
        level: number;
        name: string;
        description: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteLevel(id: string): Promise<{
        id: number;
        level: number;
        name: string;
        description: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    changeFireLevel(id: string, dto: ChangeFireLevelDto, req: RequestWithUser): Promise<{
        fireLevel: {
            id: number;
            level: number;
            name: string;
            description: string;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: number;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        fireLevelId: number;
        address: string | null;
        latitude: number;
        longitude: number;
        fireStationId: number;
        status: import(".prisma/client").$Enums.IncidentStatus;
        reportedById: number;
        assignedToId: number;
        resolvedAt: Date | null;
    }>;
    getAllAddressLevels(): Promise<({
        fireLevel: {
            id: number;
            level: number;
            name: string;
            description: string;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: number;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        fireLevelId: number;
        address: string;
    })[]>;
    getAddressLevelById(id: string): Promise<{
        fireLevel: {
            id: number;
            level: number;
            name: string;
            description: string;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: number;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        fireLevelId: number;
        address: string;
    }>;
    createAddressLevel(dto: CreateAddressLevelDto): Promise<{
        fireLevel: {
            id: number;
            level: number;
            name: string;
            description: string;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: number;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        fireLevelId: number;
        address: string;
    }>;
    updateAddressLevel(id: string, dto: CreateAddressLevelDto): Promise<{
        fireLevel: {
            id: number;
            level: number;
            name: string;
            description: string;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: number;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        fireLevelId: number;
        address: string;
    }>;
    deleteAddressLevel(id: string): Promise<{
        id: number;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        fireLevelId: number;
        address: string;
    }>;
}
export {};
