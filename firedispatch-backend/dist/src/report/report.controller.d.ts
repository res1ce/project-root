import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';
import { Response, Request } from 'express';
import { CreateFireReportDto } from './dto/create-fire-report.dto';
interface RequestWithUser extends Request {
    user?: any;
}
export declare class ReportController {
    private readonly reportService;
    constructor(reportService: ReportService);
    create(req: RequestWithUser, dto: CreateReportDto): Promise<{
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
    getById(id: string): Promise<({
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
    delete(id: string): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        userId: number;
        fireIncidentId: number;
        content: string;
    }>;
    createFireReport(req: RequestWithUser, dto: CreateFireReportDto): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        userId: number;
        fireIncidentId: number;
        content: string;
    }>;
    getFireReports(fireIncidentId: string): Promise<({
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
    getFireIncidentPdf(fireIncidentId: string, res: Response): Promise<void>;
    getStatisticsPdf(startDateStr: string, endDateStr: string, stationIdStr: string, res: Response): Promise<void>;
}
export {};
