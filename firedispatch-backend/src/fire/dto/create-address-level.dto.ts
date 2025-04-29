import { IsString, IsInt, IsOptional } from 'class-validator';

export class CreateAddressLevelDto {
  @IsString()
  address: string;
  
  @IsInt()
  fireLevelId: number;
  
  @IsOptional()
  @IsString()
  description?: string;
} 