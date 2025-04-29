import { IsString, IsNumber } from 'class-validator';

export class CreateFireStationDto {
  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
} 