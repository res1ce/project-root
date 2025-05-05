import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserActivityService } from './user-activity.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UserApiController } from './user-api.controller';
import { RoleController } from './role.controller';

@Module({
  imports: [PrismaModule],
  controllers: [UserController, UserApiController, RoleController],
  providers: [UserService, UserActivityService],
  exports: [UserService, UserActivityService]
})
export class UserModule {}
