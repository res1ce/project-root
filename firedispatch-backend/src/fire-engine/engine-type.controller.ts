import { Controller, Get, UseGuards, Logger } from '@nestjs/common';
import { FireEngineService } from './fire-engine.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('engine-type')
export class EngineTypeController {
  private readonly logger = new Logger(EngineTypeController.name);

  constructor(private readonly fireEngineService: FireEngineService) {
    this.logger.log('EngineTypeController initialized');
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllEngineTypes() {
    this.logger.log('GET /engine-type called');
    // Получаем все типы движков из Prisma enum VehicleType
    return this.fireEngineService.getAllEngineTypes();
  }
} 