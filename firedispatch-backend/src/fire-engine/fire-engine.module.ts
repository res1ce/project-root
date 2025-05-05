import { Module } from '@nestjs/common';
import { FireEngineService } from './fire-engine.service';
import { FireEngineController } from './fire-engine.controller';
import { EngineTypeController } from './engine-type.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [FireEngineService],
  controllers: [FireEngineController, EngineTypeController]
})
export class FireEngineModule {}
