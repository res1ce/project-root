import { Module } from '@nestjs/common';
import { SystemSettingsController } from './system-settings.controller';
import { SystemSettingsService } from './system-settings.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [SystemSettingsController],
  providers: [SystemSettingsService, PrismaService],
  exports: [SystemSettingsService]
})
export class SystemSettingsModule {} 