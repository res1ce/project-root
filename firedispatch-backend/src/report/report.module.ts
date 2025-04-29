import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { FireModule } from '../fire/fire.module';

@Module({
  imports: [FireModule],
  providers: [ReportService],
  controllers: [ReportController]
})
export class ReportModule {}
