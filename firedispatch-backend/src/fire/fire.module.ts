import { Module } from '@nestjs/common';
import { FireController } from './fire.controller';
import { FireService } from './fire.service';
import { FireEventsGateway } from './fire-events.gateway';
import { UserModule } from '../user/user.module';
import { PrismaModule } from '../prisma/prisma.module';
import { FireLevelController } from './fire-level.controller';

@Module({
  imports: [UserModule, PrismaModule],
  controllers: [FireController, FireLevelController],
  providers: [FireService, FireEventsGateway],
  exports: [FireService, FireEventsGateway]
})
export class FireModule {}
