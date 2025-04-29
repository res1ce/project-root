import { Module } from '@nestjs/common';
import { FireEngineService } from './fire-engine.service';
import { FireEngineController } from './fire-engine.controller';

@Module({
  providers: [FireEngineService],
  controllers: [FireEngineController]
})
export class FireEngineModule {}
