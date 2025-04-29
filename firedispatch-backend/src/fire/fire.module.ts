import { Module } from '@nestjs/common';
import { FireController } from './fire.controller';
import { FireService } from './fire.service';
import { FireEventsGateway } from './fire-events.gateway';
import { UserModule } from '../user/user.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [UserModule, PrismaModule],
  controllers: [FireController],
  providers: [FireService, FireEventsGateway],
  exports: [FireService, FireEventsGateway]
})
export class FireModule {}
