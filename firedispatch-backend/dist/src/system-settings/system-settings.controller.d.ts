import { SystemSettingsService } from './system-settings.service';
import { UpdateSystemSettingsDto } from './dto/update-system-settings.dto';
import { Request } from 'express';
interface RequestWithUser extends Request {
    user?: any;
}
export declare class SystemSettingsController {
    private readonly systemSettingsService;
    constructor(systemSettingsService: SystemSettingsService);
    getSettings(): Promise<{
        id: number;
        defaultCityName: string;
        defaultLatitude: number;
        defaultLongitude: number;
        defaultZoom: number;
        updatedAt: Date;
        updatedById: number | null;
    }>;
    updateSettings(dto: UpdateSystemSettingsDto, req: RequestWithUser): Promise<{
        updatedBy: {
            id: number;
            name: string;
            username: string;
        } | null;
    } & {
        id: number;
        defaultCityName: string;
        defaultLatitude: number;
        defaultLongitude: number;
        defaultZoom: number;
        updatedAt: Date;
        updatedById: number | null;
    }>;
}
export {};
