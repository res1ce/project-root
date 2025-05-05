import { Module } from '@nestjs/common';
import { EngineTypeController } from './engine-type.controller';

@Module({
  controllers: [EngineTypeController],
})
export class EngineTypeModule {} 