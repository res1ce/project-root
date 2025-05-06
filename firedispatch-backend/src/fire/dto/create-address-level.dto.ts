import { IsString, IsInt, IsOptional, IsNumber } from 'class-validator';

export class CreateAddressLevelDto {
  @IsString()
  address: string;
  
  @IsInt()
  fireLevelId: number;
  
  @IsOptional()
  @IsString()
  description?: string;
  
  @IsOptional()
  @IsNumber()
  latitude?: number;
  
  @IsOptional()
  @IsNumber()
  longitude?: number;
} 