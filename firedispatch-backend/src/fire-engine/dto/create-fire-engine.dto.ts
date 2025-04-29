import { IsString, IsEnum, IsInt, IsOptional } from 'class-validator';
import { VehicleType, VehicleStatus } from '@prisma/client';

export class CreateFireEngineDto {
  @IsString()
  model: string;

  @IsEnum(VehicleType)
  type: VehicleType;

  @IsInt()
  fireStationId: number;

  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;
} 