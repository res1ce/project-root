import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateReportDto {
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsNotEmpty()
  @IsNumber()
  fireIncidentId: number;
} 