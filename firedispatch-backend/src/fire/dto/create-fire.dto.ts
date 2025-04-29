import { IsArray, ArrayMinSize, ArrayMaxSize, IsNumber, IsInt, IsString, IsOptional, IsEnum } from 'class-validator';
import { IncidentStatus } from '@prisma/client';

export class CreateFireDto {
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsNumber({}, { each: true })
  location: [number, number]; // [lon, lat]

  @IsOptional()
  @IsInt()
  levelId?: number;

  @IsOptional()
  @IsEnum(IncidentStatus)
  status?: IncidentStatus;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsInt()
  reportedById: number;

  @IsOptional()
  @IsInt()
  assignedToId?: number;

  @IsOptional()
  @IsInt()
  assignedStationId?: number;
} 