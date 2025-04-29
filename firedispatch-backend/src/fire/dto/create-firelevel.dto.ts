import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFireLevelDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  level: number;

  @IsString()
  name: string;

  @IsString()
  description: string;
} 