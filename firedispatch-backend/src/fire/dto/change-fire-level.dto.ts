import { IsInt, IsOptional, IsString, Min, Max } from 'class-validator';

export class ChangeFireLevelDto {
  @IsInt()
  @Min(1)
  @Max(5)
  newLevel: number;
 
  @IsOptional()
  @IsString()
  reason?: string;
} 