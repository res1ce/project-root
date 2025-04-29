import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class UpdateSystemSettingsDto {
  @IsOptional()
  @IsString()
  defaultCityName?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  defaultLatitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  defaultLongitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  defaultZoom?: number;
} 