import { PrismaService } from '../prisma/prisma.service';
import { CreateFireDto } from './dto/create-fire.dto';
import { FireEventsGateway } from './fire-events.gateway';
import { IncidentStatus } from '@prisma/client';
import { CreateFireLevelDto } from './dto/create-firelevel.dto';
import { ChangeFireLevelDto } from './dto/change-fire-level.dto';
import { CreateFireLevelRequirementDto } from './dto/create-firelevel-requirement.dto';
export declare class FireService {
    private readonly events;
    private readonly prisma;
    constructor(events: FireEventsGateway, prisma: PrismaService);
    create(dto: CreateFireDto): Promise<{
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
    getById(id: number): Promise<({
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
    }) | null>;
    update(id: number, dto: CreateFireDto): Promise<{
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
    delete(id: number): Promise<{
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
    getAssignmentsByFireId(fireId: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        fireStationId: number;
        model: string;
        type: import(".prisma/client").$Enums.VehicleType;
        status: import(".prisma/client").$Enums.VehicleStatus;
    }[]>;
    releaseVehiclesByFireId(fireId: number): Promise<{
        released: number;
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
    getLevelById(id: number): Promise<{
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
    updateLevel(id: number, dto: CreateFireLevelDto): Promise<{
        id: number;
        level: number;
        name: string;
        description: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteLevel(id: number): Promise<{
        id: number;
        level: number;
        name: string;
        description: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    changeFireLevel(fireId: number, dto: ChangeFireLevelDto): Promise<{
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
    setFireStatus(id: number, status: IncidentStatus): Promise<{
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
    private deg2rad;
    determineFireLevel(location: [number, number], address?: string): Promise<number>;
    getFireHistory(fireId: number): Promise<({
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
    getRequirementsByLevel(levelId: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        count: number;
        fireLevelId: number;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
    }[]>;
    getRequirementById(id: number): Promise<{
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
    updateRequirement(id: number, dto: CreateFireLevelRequirementDto): Promise<{
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
    deleteRequirement(id: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        count: number;
        fireLevelId: number;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
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
    getAddressLevelById(id: number): Promise<{
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
    createAddressLevel(data: {
        address: string;
        fireLevelId: number;
        description?: string;
    }): Promise<{
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
    updateAddressLevel(id: number, data: {
        address?: string;
        fireLevelId?: number;
        description?: string;
    }): Promise<{
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
    deleteAddressLevel(id: number): Promise<{
        id: number;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        fireLevelId: number;
        address: string;
    }>;
}
