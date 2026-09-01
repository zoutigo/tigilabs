import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule } from "@nestjs/throttler";
import { AuditModule } from "./audit/audit.module";
import { AuthModule } from "./auth/auth.module";
import { CalendarModule } from "./calendar/calendar.module";
import configuration from "./config/configuration";
import { validateEnv } from "./config/env.validation";
import { AppThrottlerGuard } from "./common/guards/app-throttler.guard";
import { CommentsModule } from "./comments/comments.module";
import { ContactModule } from "./contact/contact.module";
import { DatabaseModule } from "./database/prisma.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { RolesModule } from "./roles/roles.module";
import { SettingsModule } from "./settings/settings.module";
import { TasksModule } from "./tasks/tasks.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [".env", "../../docker/.env", "../../.env"],
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([
      {
        limit: 60,
        ttl: 60_000,
      },
    ]),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    UsersModule,
    RolesModule,
    TasksModule,
    CommentsModule,
    NotificationsModule,
    ContactModule,
    SettingsModule,
    AuditModule,
    CalendarModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: AppThrottlerGuard }],
})
export class AppModule {}
