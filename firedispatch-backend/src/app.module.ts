import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { FireStationModule } from './fire-station/fire-station.module';
import { FireModule } from './fire/fire.module';
import { ReportModule } from './report/report.module';
import { WebsocketModule } from './websocket/websocket.module';
import { SystemSettingsModule } from './system-settings/system-settings.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    FireStationModule,
    FireModule,
    ReportModule,
    WebsocketModule,
    SystemSettingsModule,
  ],
})
export class AppModule {}
