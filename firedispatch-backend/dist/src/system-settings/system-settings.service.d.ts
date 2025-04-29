import { PrismaService } from '../prisma/prisma.service';
import { UpdateSystemSettingsDto } from './dto/update-system-settings.dto';
export declare class SystemSettingsService {
    private prisma;
    constructor(prisma: PrismaService);
    getSettings(): Promise<{
        id: number;
        updatedAt: Date;
        defaultCityName: string;
        defaultLatitude: number;
        defaultLongitude: number;
        defaultZoom: number;
        updatedById: number | null;
    }>;
    updateSettings(dto: UpdateSystemSettingsDto, userId: number): Promise<{
        updatedBy: {
            id: number;
            name: string;
            username: string;
        } | null;
    } & {
        id: number;
        updatedAt: Date;
        defaultCityName: string;
        defaultLatitude: number;
        defaultLongitude: number;
        defaultZoom: number;
        updatedById: number | null;
    }>;
}
