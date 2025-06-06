import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { FireEventsGateway } from '../fire/fire-events.gateway';
export declare class ReportService {
    private readonly events;
    private prisma;
    private readonly logger;
    private readonly reportsDir;
    constructor(events: FireEventsGateway, prisma: PrismaService);
    create(userId: number, dto: CreateReportDto): Promise<{
        user: {
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
        createdAt: Date;
        updatedAt: Date;
        userId: number;
        fireIncidentId: number;
        content: string;
    }>;
    getAll(): Promise<({
        user: {
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
        createdAt: Date;
        updatedAt: Date;
        userId: number;
        fireIncidentId: number;
        content: string;
    })[]>;
    getById(id: number): Promise<({
        user: {
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
        createdAt: Date;
        updatedAt: Date;
        userId: number;
        fireIncidentId: number;
        content: string;
    }) | null>;
    delete(id: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        userId: number;
        fireIncidentId: number;
        content: string;
    }>;
    createFireReport(userId: number, fireIncidentId: number, content: string): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        userId: number;
        fireIncidentId: number;
        content: string;
    }>;
    getFireReports(fireIncidentId: number): Promise<({
        user: {
            name: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        userId: number;
        fireIncidentId: number;
        content: string;
    })[]>;
    generateFireIncidentPDF(fireIncidentId: number): Promise<string>;
    generateStatisticsReport(startDate: Date, endDate: Date, stationId?: number): Promise<string>;
    private getStatusText;
}
