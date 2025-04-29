import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateFireReportDto {
  @IsNotEmpty()
  @IsNumber()
  fireIncidentId: number;

  @IsNotEmpty()
  @IsString()
  content: string;
} 