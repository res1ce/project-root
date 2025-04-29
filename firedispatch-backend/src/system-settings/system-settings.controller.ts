import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { SystemSettingsService } from './system-settings.service';
import { UpdateSystemSettingsDto } from './dto/update-system-settings.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user?: any;
}

@Controller('system-settings')
export class SystemSettingsController {
  constructor(private readonly systemSettingsService: SystemSettingsService) {}

  @Get()
  getSettings() {
    return this.systemSettingsService.getSettings();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put()
  updateSettings(@Body() dto: UpdateSystemSettingsDto, @Req() req: RequestWithUser) {
    return this.systemSettingsService.updateSettings(dto, req.user.userId);
  }
} 