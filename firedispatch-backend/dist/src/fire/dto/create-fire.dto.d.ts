import { IncidentStatus } from '@prisma/client';
export declare class CreateFireDto {
    location: [number, number];
    levelId?: number;
    status?: IncidentStatus;
    description?: string;
    address?: string;
    reportedById?: number;
    assignedToId?: number;
    assignedStationId?: number;
    autoLevel?: boolean;
}
