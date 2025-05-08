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
            id: any;
            type: any;
            name: any;
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
    private getReadableStatus;
    getAll(userId?: number, userRole?: UserRole | string): Promise<{
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
            content: string;
            userId: number;
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
    getById(id: number): Promise<{
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
            content: string;
            userId: number;
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
    } | null>;
    update(id: number, dto: CreateFireDto): Promise<{
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
    delete(id: number): Promise<{
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
    getAssignmentsByFireId(fireId: number): Promise<{
        id: number;
        updatedAt: Date;
        createdAt: Date;
        model: string;
        type: import(".prisma/client").$Enums.VehicleType;
        status: import(".prisma/client").$Enums.VehicleStatus;
        fireStationId: number;
    }[]>;
    releaseVehiclesByFireId(fireId: number): Promise<{
        released: number;
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
    getLevelById(id: number): Promise<({
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
    }) | null>;
    getLevelByNumber(level: number): Promise<{
        id: number;
        updatedAt: Date;
        name: string;
        createdAt: Date;
        level: number;
        description: string;
    } | null>;
    getFirstLevel(): Promise<{
        id: number;
        updatedAt: Date;
        name: string;
        createdAt: Date;
        level: number;
        description: string;
    } | null>;
    createLevel(dto: CreateFireLevelDto): Promise<{
        id: number;
        updatedAt: Date;
        name: string;
        createdAt: Date;
        level: number;
        description: string;
    }>;
    updateLevel(id: number, dto: CreateFireLevelDto): Promise<{
        id: number;
        updatedAt: Date;
        name: string;
        createdAt: Date;
        level: number;
        description: string;
    }>;
    deleteLevel(id: number): Promise<{
        id: number;
        updatedAt: Date;
        name: string;
        createdAt: Date;
        level: number;
        description: string;
    }>;
    changeFireLevel(fireId: number, dto: ChangeFireLevelDto): Promise<{
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
    setFireStatus(id: number, status: IncidentStatus): Promise<{
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
    private deg2rad;
    determineFireLevel(location: [number, number], address?: string): Promise<number>;
    private calculateDistance;
    getFireHistory(fireId: number): Promise<({
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
    getRequirementsByLevel(levelId: number): Promise<{
        id: number;
        updatedAt: Date;
        createdAt: Date;
        count: number;
        fireLevelId: number;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
    }[]>;
    getRequirementById(id: number): Promise<{
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
    updateRequirement(id: number, dto: CreateFireLevelRequirementDto): Promise<{
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
    deleteRequirement(id: number): Promise<{
        id: number;
        updatedAt: Date;
        createdAt: Date;
        count: number;
        fireLevelId: number;
        vehicleType: import(".prisma/client").$Enums.VehicleType;
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
    getAddressLevelById(id: number): Promise<{
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
    createAddressLevel(data: {
        address: string;
        fireLevelId: number;
        description?: string;
        latitude?: number;
        longitude?: number;
    }): Promise<{
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
    updateAddressLevel(id: number, data: {
        address?: string;
        fireLevelId?: number;
        description?: string;
    }): Promise<{
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
    deleteAddressLevel(id: number): Promise<{
        id: number;
        updatedAt: Date;
        address: string;
        latitude: number | null;
        longitude: number | null;
        createdAt: Date;
        description: string | null;
        fireLevelId: number;
    }>;
}
