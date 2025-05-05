import { PrismaService } from '../prisma/prisma.service';
import { CreateFireDto } from './dto/create-fire.dto';
import { FireEventsGateway } from './fire-events.gateway';
import { IncidentStatus, UserRole } from '@prisma/client';
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
    private getReadableStatus;
    getAll(userId?: number, userRole?: UserRole | string): Promise<{
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
    getById(id: number): Promise<{
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
    } | null>;
    update(id: number, dto: CreateFireDto): Promise<{
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
    delete(id: number): Promise<{
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
    getAssignmentsByFireId(fireId: number): Promise<{
        id: number;
        status: import(".prisma/client").$Enums.VehicleStatus;
        createdAt: Date;
        updatedAt: Date;
        fireStationId: number;
        model: string;
        type: import(".prisma/client").$Enums.VehicleType;
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
        description: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        level: number;
    })[]>;
    getLevelById(id: number): Promise<{
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
    updateLevel(id: number, dto: CreateFireLevelDto): Promise<{
        id: number;
        description: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        level: number;
    }>;
    deleteLevel(id: number): Promise<{
        id: number;
        description: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        level: number;
    }>;
    changeFireLevel(fireId: number, dto: ChangeFireLevelDto): Promise<{
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
    setFireStatus(id: number, status: IncidentStatus): Promise<{
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
    private deg2rad;
    determineFireLevel(location: [number, number], address?: string): Promise<number>;
    getFireHistory(fireId: number): Promise<({
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
    getRequirementsByLevel(levelId: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        fireLevelId: number;
        count: number;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
    }[]>;
    getRequirementById(id: number): Promise<{
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
    updateRequirement(id: number, dto: CreateFireLevelRequirementDto): Promise<{
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
    deleteRequirement(id: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        fireLevelId: number;
        count: number;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
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
    getAddressLevelById(id: number): Promise<{
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
    createAddressLevel(data: {
        address: string;
        fireLevelId: number;
        description?: string;
    }): Promise<{
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
    updateAddressLevel(id: number, data: {
        address?: string;
        fireLevelId?: number;
        description?: string;
    }): Promise<{
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
    deleteAddressLevel(id: number): Promise<{
        id: number;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        address: string;
        fireLevelId: number;
    }>;
}
