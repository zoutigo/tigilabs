import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { DatabaseModule } from "../database/prisma.module";
import { UsersModule } from "../users/users.module";
import { AuthMailService } from "./auth-mail.service";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "dev-secret",
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN ?? "1d" },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, AuthMailService],
  exports: [AuthService],
})
export class AuthModule {}
