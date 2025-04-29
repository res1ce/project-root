import { Module } from '@nestjs/common';
import { FireStationService } from './fire-station.service';
import { FireStationController } from './fire-station.controller';

@Module({
  providers: [FireStationService],
  controllers: [FireStationController]
})
export class FireStationModule {}
