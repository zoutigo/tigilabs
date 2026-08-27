import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuditModule } from "./audit/audit.module";
import { AuthModule } from "./auth/auth.module";
import configuration from "./config/configuration";
import { validateEnv } from "./config/env.validation";
import { CommentsModule } from "./comments/comments.module";
import { DatabaseModule } from "./database/prisma.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { RolesModule } from "./roles/roles.module";
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
    DatabaseModule,
    AuthModule,
    UsersModule,
    RolesModule,
    TasksModule,
    CommentsModule,
    NotificationsModule,
    AuditModule,
  ],
})
export class AppModule {}
