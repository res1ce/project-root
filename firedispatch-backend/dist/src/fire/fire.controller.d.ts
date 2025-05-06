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
    getAll(req: RequestWithUser): Promise<{
        readableStatus: string;
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
        vehicles: {
            id: number;
            updatedAt: Date;
            createdAt: Date;
            model: string;
            type: import(".prisma/client").$Enums.VehicleType;
            status: import(".prisma/client").$Enums.VehicleStatus;
            fireStationId: number;
        }[];
        fireLevel: {
            id: number;
            updatedAt: Date;
            name: string;
            createdAt: Date;
            level: number;
            description: string;
        };
        reports: {
            id: number;
            updatedAt: Date;
            createdAt: Date;
            fireIncidentId: number;
            userId: number;
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
        id: number;
        updatedAt: Date;
        address: string | null;
        latitude: number;
        longitude: number;
        createdAt: Date;
        description: string | null;
        fireLevelId: number;
        status: import(".prisma/client").$Enums.IncidentStatus;
        fireStationId: number;
        resolvedAt: Date | null;
        reportedById: number;
        assignedToId: number;
    }[]>;
    getAllRequirements(): Promise<({
        fireLevel: {
            id: number;
            updatedAt: Date;
            name: string;
            createdAt: Date;
            level: number;
            description: string;
        };
    } & {
        id: number;
        updatedAt: Date;
        createdAt: Date;
        count: number;
        fireLevelId: number;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
    })[]>;
    getRequirementById(id: string): Promise<{
        fireLevel: {
            id: number;
            updatedAt: Date;
            name: string;
            createdAt: Date;
            level: number;
            description: string;
        };
    } & {
        id: number;
        updatedAt: Date;
        createdAt: Date;
        count: number;
        fireLevelId: number;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
    }>;
    createRequirement(dto: CreateFireLevelRequirementDto): Promise<{
        fireLevel: {
            id: number;
            updatedAt: Date;
            name: string;
            createdAt: Date;
            level: number;
            description: string;
        };
    } & {
        id: number;
        updatedAt: Date;
        createdAt: Date;
        count: number;
        fireLevelId: number;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
    }>;
    updateRequirement(id: string, dto: CreateFireLevelRequirementDto): Promise<{
        fireLevel: {
            id: number;
            updatedAt: Date;
            name: string;
            createdAt: Date;
            level: number;
            description: string;
        };
    } & {
        id: number;
        updatedAt: Date;
        createdAt: Date;
        count: number;
        fireLevelId: number;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
    }>;
    deleteRequirement(id: string): Promise<{
        id: number;
        updatedAt: Date;
        createdAt: Date;
        count: number;
        fireLevelId: number;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
    }>;
    getAllLevels(): Promise<({
        requirements: {
            id: number;
            updatedAt: Date;
            createdAt: Date;
            count: number;
            fireLevelId: number;
            vehicleType: import(".prisma/client").$Enums.VehicleType;
        }[];
    } & {
        id: number;
        updatedAt: Date;
        name: string;
        createdAt: Date;
        level: number;
        description: string;
    })[]>;
    getLevelById(id: string): Promise<{
        requirements: {
            id: number;
            updatedAt: Date;
            createdAt: Date;
            count: number;
            fireLevelId: number;
            vehicleType: import(".prisma/client").$Enums.VehicleType;
        }[];
    } & {
        id: number;
        updatedAt: Date;
        name: string;
        createdAt: Date;
        level: number;
        description: string;
    }>;
    createLevel(dto: CreateFireLevelDto): Promise<{
        id: number;
        updatedAt: Date;
        name: string;
        createdAt: Date;
        level: number;
        description: string;
    }>;
    updateLevel(id: string, dto: CreateFireLevelDto): Promise<{
        id: number;
        updatedAt: Date;
        name: string;
        createdAt: Date;
        level: number;
        description: string;
    }>;
    deleteLevel(id: string): Promise<{
        id: number;
        updatedAt: Date;
        name: string;
        createdAt: Date;
        level: number;
        description: string;
    }>;
    getAllAddressLevels(): Promise<({
        fireLevel: {
            id: number;
            updatedAt: Date;
            name: string;
            createdAt: Date;
            level: number;
            description: string;
        };
    } & {
        id: number;
        updatedAt: Date;
        address: string;
        latitude: number | null;
        longitude: number | null;
        createdAt: Date;
        description: string | null;
        fireLevelId: number;
    })[]>;
    getAddressLevelById(id: string): Promise<{
        fireLevel: {
            id: number;
            updatedAt: Date;
            name: string;
            createdAt: Date;
            level: number;
            description: string;
        };
    } & {
        id: number;
        updatedAt: Date;
        address: string;
        latitude: number | null;
        longitude: number | null;
        createdAt: Date;
        description: string | null;
        fireLevelId: number;
    }>;
    createAddressLevel(dto: CreateAddressLevelDto): Promise<{
        fireLevel: {
            id: number;
            updatedAt: Date;
            name: string;
            createdAt: Date;
            level: number;
            description: string;
        };
    } & {
        id: number;
        updatedAt: Date;
        address: string;
        latitude: number | null;
        longitude: number | null;
        createdAt: Date;
        description: string | null;
        fireLevelId: number;
    }>;
    updateAddressLevel(id: string, dto: CreateAddressLevelDto): Promise<{
        fireLevel: {
            id: number;
            updatedAt: Date;
            name: string;
            createdAt: Date;
            level: number;
            description: string;
        };
    } & {
        id: number;
        updatedAt: Date;
        address: string;
        latitude: number | null;
        longitude: number | null;
        createdAt: Date;
        description: string | null;
        fireLevelId: number;
    }>;
    deleteAddressLevel(id: string): Promise<{
        id: number;
        updatedAt: Date;
        address: string;
        latitude: number | null;
        longitude: number | null;
        createdAt: Date;
        description: string | null;
        fireLevelId: number;
    }>;
    create(dto: CreateFireDto, req: RequestWithUser): Promise<{
        assignedVehicles: {
            id: number;
            updatedAt: Date;
            createdAt: Date;
            model: string;
            type: import(".prisma/client").$Enums.VehicleType;
            status: import(".prisma/client").$Enums.VehicleStatus;
            fireStationId: number;
        }[];
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
        fireLevel: {
            id: number;
            updatedAt: Date;
            name: string;
            createdAt: Date;
            level: number;
            description: string;
        };
        reportedBy: {
            id: number;
            updatedAt: Date;
            name: string;
            createdAt: Date;
            fireStationId: number | null;
            username: string;
            password: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
        assignedTo: {
            id: number;
            updatedAt: Date;
            name: string;
            createdAt: Date;
            fireStationId: number | null;
            username: string;
            password: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
        id: number;
        updatedAt: Date;
        address: string | null;
        latitude: number;
        longitude: number;
        createdAt: Date;
        description: string | null;
        fireLevelId: number;
        status: import(".prisma/client").$Enums.IncidentStatus;
        fireStationId: number;
        resolvedAt: Date | null;
        reportedById: number;
        assignedToId: number;
    }>;
    getById(id: string): Promise<{
        readableStatus: string;
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
        vehicles: {
            id: number;
            updatedAt: Date;
            createdAt: Date;
            model: string;
            type: import(".prisma/client").$Enums.VehicleType;
            status: import(".prisma/client").$Enums.VehicleStatus;
            fireStationId: number;
        }[];
        fireLevel: {
            requirements: {
                id: number;
                updatedAt: Date;
                createdAt: Date;
                count: number;
                fireLevelId: number;
                vehicleType: import(".prisma/client").$Enums.VehicleType;
            }[];
        } & {
            id: number;
            updatedAt: Date;
            name: string;
            createdAt: Date;
            level: number;
            description: string;
        };
        reports: {
            id: number;
            updatedAt: Date;
            createdAt: Date;
            fireIncidentId: number;
            userId: number;
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
        id: number;
        updatedAt: Date;
        address: string | null;
        latitude: number;
        longitude: number;
        createdAt: Date;
        description: string | null;
        fireLevelId: number;
        status: import(".prisma/client").$Enums.IncidentStatus;
        fireStationId: number;
        resolvedAt: Date | null;
        reportedById: number;
        assignedToId: number;
    }>;
    update(id: string, dto: CreateFireDto, req: RequestWithUser): Promise<{
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
        vehicles: {
            id: number;
            updatedAt: Date;
            createdAt: Date;
            model: string;
            type: import(".prisma/client").$Enums.VehicleType;
            status: import(".prisma/client").$Enums.VehicleStatus;
            fireStationId: number;
        }[];
        fireLevel: {
            id: number;
            updatedAt: Date;
            name: string;
            createdAt: Date;
            level: number;
            description: string;
        };
        reportedBy: {
            id: number;
            updatedAt: Date;
            name: string;
            createdAt: Date;
            fireStationId: number | null;
            username: string;
            password: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
        assignedTo: {
            id: number;
            updatedAt: Date;
            name: string;
            createdAt: Date;
            fireStationId: number | null;
            username: string;
            password: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    } & {
        id: number;
        updatedAt: Date;
        address: string | null;
        latitude: number;
        longitude: number;
        createdAt: Date;
        description: string | null;
        fireLevelId: number;
        status: import(".prisma/client").$Enums.IncidentStatus;
        fireStationId: number;
        resolvedAt: Date | null;
        reportedById: number;
        assignedToId: number;
    }>;
    delete(id: string): Promise<{
        id: number;
        updatedAt: Date;
        address: string | null;
        latitude: number;
        longitude: number;
        createdAt: Date;
        description: string | null;
        fireLevelId: number;
        status: import(".prisma/client").$Enums.IncidentStatus;
        fireStationId: number;
        resolvedAt: Date | null;
        reportedById: number;
        assignedToId: number;
    }>;
    getAssignments(id: string): Promise<{
        id: number;
        updatedAt: Date;
        createdAt: Date;
        model: string;
        type: import(".prisma/client").$Enums.VehicleType;
        status: import(".prisma/client").$Enums.VehicleStatus;
        fireStationId: number;
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
        action: string;
        details: string | null;
        timestamp: Date;
        userId: number;
        ipAddress: string | null;
        userAgent: string | null;
    })[]>;
    changeFireLevel(id: string, dto: ChangeFireLevelDto, req: RequestWithUser): Promise<{
        fireLevel: {
            id: number;
            updatedAt: Date;
            name: string;
            createdAt: Date;
            level: number;
            description: string;
        };
    } & {
        id: number;
        updatedAt: Date;
        address: string | null;
        latitude: number;
        longitude: number;
        createdAt: Date;
        description: string | null;
        fireLevelId: number;
        status: import(".prisma/client").$Enums.IncidentStatus;
        fireStationId: number;
        resolvedAt: Date | null;
        reportedById: number;
        assignedToId: number;
    }>;
    resolveFire(id: string, req: RequestWithUser): Promise<{
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
        fireLevel: {
            id: number;
            updatedAt: Date;
            name: string;
            createdAt: Date;
            level: number;
            description: string;
        };
    } & {
        id: number;
        updatedAt: Date;
        address: string | null;
        latitude: number;
        longitude: number;
        createdAt: Date;
        description: string | null;
        fireLevelId: number;
        status: import(".prisma/client").$Enums.IncidentStatus;
        fireStationId: number;
        resolvedAt: Date | null;
        reportedById: number;
        assignedToId: number;
    }>;
}
export {};
