import { IsInt, IsPositive, Min, IsEnum } from 'class-validator';
import { VehicleType } from '@prisma/client';

export class CreateFireLevelRequirementDto {
  @IsInt()
  fireLevelId: number;

  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @IsInt()
  @IsPositive()
  @Min(1)
  count: number;
} 