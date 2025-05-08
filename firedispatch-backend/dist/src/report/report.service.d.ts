import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { FireEventsGateway } from '../fire/fire-events.gateway';
export declare class ReportService {
    private readonly events;
    private prisma;
    private readonly logger;
    private readonly reportsDir;
    private readonly pdfGenerator;
    constructor(events: FireEventsGateway, prisma: PrismaService);
    create(userId: number, dto: CreateReportDto): Promise<{
        user: {
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
        createdAt: Date;
        fireIncidentId: number;
        content: string;
        userId: number;
    }>;
    getAll(): Promise<({
        user: {
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
        createdAt: Date;
        fireIncidentId: number;
        content: string;
        userId: number;
    })[]>;
    getById(id: number): Promise<({
        user: {
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
        createdAt: Date;
        fireIncidentId: number;
        content: string;
        userId: number;
    }) | null>;
    delete(id: number): Promise<{
        id: number;
        updatedAt: Date;
        createdAt: Date;
        fireIncidentId: number;
        content: string;
        userId: number;
    }>;
    createFireReport(userId: number, fireIncidentId: number, content: string): Promise<{
        id: number;
        updatedAt: Date;
        createdAt: Date;
        fireIncidentId: number;
        content: string;
        userId: number;
    }>;
    getFireReports(fireIncidentId: number): Promise<({
        user: {
            name: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    } & {
        id: number;
        updatedAt: Date;
        createdAt: Date;
        fireIncidentId: number;
        content: string;
        userId: number;
    })[]>;
    generateFireIncidentPDF(fireIncidentId: number): Promise<string>;
    generateFireIncidentExcel(fireIncidentId: number): Promise<string>;
    generateStatisticsReport(startDate: Date, endDate: Date, stationId?: number): Promise<string>;
    private getStatusText;
    private getStatusInEnglish;
    private drawTable;
    private calculateDistance;
    private deg2rad;
    generateStatisticsExcel(startDate: Date, endDate: Date, stationId?: number): Promise<string>;
}
