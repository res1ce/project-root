import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateFireStationDto {
  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
  
  @IsOptional()
  @IsString()
  phoneNumber?: string;
} 