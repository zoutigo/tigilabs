import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { AuthService } from "./auth.service";
import { ChangeEmailDto } from "./dto/change-email.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { ConfirmEmailChangeDto } from "./dto/confirm-email-change.dto";
import { ConfirmEmailDto } from "./dto/confirm-email.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { RegisterDto } from "./dto/register.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";

type AuthenticatedRequest = {
  user: { id: string };
};

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("confirm-email")
  confirmEmail(@Body() dto: ConfirmEmailDto) {
    return this.authService.confirmEmail(dto.token);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("forgot-password")
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("reset-password")
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post("refresh")
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@Req() request: AuthenticatedRequest) {
    return this.authService.getMe(request.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("me")
  updateProfile(
    @Body() dto: UpdateProfileDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.authService.updateProfile(request.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post("change-email")
  changeEmail(
    @Body() dto: ChangeEmailDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.authService.changeEmail(request.user.id, dto);
  }

  @Post("confirm-email-change")
  confirmEmailChange(@Body() dto: ConfirmEmailChangeDto) {
    return this.authService.confirmEmailChange(dto.token);
  }

  @UseGuards(JwtAuthGuard)
  @Post("change-password")
  changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.authService.changePassword(request.user.id, dto);
  }
}
