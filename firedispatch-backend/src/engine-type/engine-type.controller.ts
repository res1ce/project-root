import { Controller, Get, UseGuards, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VehicleType } from '@prisma/client';

@Controller('engine-type')
export class EngineTypeController {
  private readonly logger = new Logger(EngineTypeController.name);

  constructor() {
    this.logger.log('EngineTypeController initialized');
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllEngineTypes() {
    this.logger.log('GET /engine-type called');
    
    // Получаем все возможные значения enum VehicleType
    const enumValues = Object.values(VehicleType);
    
    // Превращаем их в удобный для фронтенда формат
    return enumValues.map((type, index) => ({
      id: index + 1,
      name: type,
      description: this.getVehicleTypeDescription(type)
    }));
  }
  
  // Вспомогательный метод для получения описания типа транспорта
  private getVehicleTypeDescription(type: VehicleType): string {
    switch (type) {
      case VehicleType.FIRE_TRUCK:
        return 'Пожарная машина';
      case VehicleType.LADDER_TRUCK:
        return 'Пожарная автолестница';
      case VehicleType.RESCUE_VEHICLE:
        return 'Спасательный автомобиль';
      case VehicleType.WATER_TANKER:
        return 'Автоцистерна';
      case VehicleType.COMMAND_VEHICLE:
        return 'Штабной автомобиль';
      default:
        return 'Неизвестный тип';
    }
  }
} 