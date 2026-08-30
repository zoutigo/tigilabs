import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AuthTokenType, UserStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../database/prisma.service";
import { UsersService } from "../users/users.service";
import { AuthMailService } from "./auth-mail.service";
import { ChangeEmailDto } from "./dto/change-email.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";

const EMAIL_CONFIRMATION_EXPIRES_IN_HOURS = 24;
const PASSWORD_RESET_EXPIRES_IN_HOURS = 1;
const EMAIL_CHANGE_EXPIRES_IN_HOURS = 1;

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly authMailService: AuthMailService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(
      this.normalizeEmail(dto.email),
    );

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isValidPassword = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException("Adresse email non confirmee.");
    }

    const roles = user.roles?.map((item) => item.role.name) ?? [];
    const permissions =
      user.roles?.flatMap((item) =>
        item.role.permissions.map(
          ({ permission }) => `${permission.subject}.${permission.action}`,
        ),
      ) ?? [];
    const payload = { sub: user.id, email: user.email, roles, permissions };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      refreshToken: await this.jwtService.signAsync(payload, {
        expiresIn: "7d",
      }),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status,
        roles,
        permissions,
      },
    };
  }

  async register(dto: RegisterDto) {
    if (dto.password !== dto.passwordConfirm) {
      throw new BadRequestException("Les mots de passe ne correspondent pas.");
    }

    const email = this.normalizeEmail(dto.email);
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException("Cette adresse email est deja inscrite.");
    }

    const firstName = dto.firstName.trim();
    const lastName = dto.lastName.trim();
    if (firstName.length < 2 || lastName.length < 2) {
      throw new BadRequestException("Le nom et le prenom sont obligatoires.");
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        passwordHash,
        status: UserStatus.INVITED,
      },
    });

    const confirmationToken = await this.createAuthToken(
      user.id,
      AuthTokenType.EMAIL_CONFIRMATION,
      EMAIL_CONFIRMATION_EXPIRES_IN_HOURS,
    );

    await this.authMailService.sendEmailConfirmation({
      to: user.email,
      name: user.firstName ?? user.name,
      url: this.buildWebUrl("/confirm-email", confirmationToken),
    });

    return {
      activationExpiresInHours: EMAIL_CONFIRMATION_EXPIRES_IN_HOURS,
      message: "Compte cree. Confirmez votre adresse email pour l'activer.",
    };
  }

  async confirmEmail(token: string) {
    const authToken = await this.findValidToken(
      token,
      AuthTokenType.EMAIL_CONFIRMATION,
    );

    await this.prisma.$transaction([
      this.prisma.authToken.update({
        where: { id: authToken.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: authToken.userId },
        data: { status: UserStatus.ACTIVE },
      }),
    ]);

    return {
      message: "Email confirme. Vous pouvez maintenant vous connecter.",
    };
  }

  async forgotPassword(emailValue: string) {
    const email = this.normalizeEmail(emailValue);
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        name: true,
        status: true,
      },
    });

    if (user?.status === UserStatus.ACTIVE) {
      const resetToken = await this.createAuthToken(
        user.id,
        AuthTokenType.PASSWORD_RESET,
        PASSWORD_RESET_EXPIRES_IN_HOURS,
      );

      await this.authMailService.sendPasswordReset({
        to: user.email,
        name: user.firstName ?? user.name,
        url: this.buildWebUrl("/reset-password", resetToken),
      });
    }

    return {
      message:
        "Si cette adresse existe, un lien de reinitialisation a ete envoye.",
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    if (dto.password !== dto.passwordConfirm) {
      throw new BadRequestException("Les mots de passe ne correspondent pas.");
    }

    const authToken = await this.findValidToken(
      dto.token,
      AuthTokenType.PASSWORD_RESET,
    );
    const passwordHash = await bcrypt.hash(dto.password, 12);

    await this.prisma.$transaction([
      this.prisma.authToken.update({
        where: { id: authToken.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: authToken.userId },
        data: { passwordHash },
      }),
    ]);

    return { message: "Mot de passe mis a jour. Vous pouvez vous connecter." };
  }

  getMe(userId: string) {
    return this.usersService.findOne(userId);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const current = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    const firstName = dto.firstName?.trim() ?? current.firstName ?? "";
    const lastName = dto.lastName?.trim() ?? current.lastName ?? "";

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName !== undefined ? firstName : undefined,
        lastName: dto.lastName !== undefined ? lastName : undefined,
        name: `${firstName} ${lastName}`.trim(),
      },
    });

    return this.usersService.findOne(userId);
  }

  async changeEmail(userId: string, dto: ChangeEmailDto) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { email: true, firstName: true, name: true, passwordHash: true },
    });

    const isValidPassword = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException("Mot de passe incorrect.");
    }

    const newEmail = this.normalizeEmail(dto.newEmail);

    if (newEmail === user.email) {
      throw new BadRequestException(
        "Cette adresse email est deja votre adresse actuelle.",
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: newEmail },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException("Cette adresse email est deja utilisee.");
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { pendingEmail: newEmail },
    });

    const changeToken = await this.createAuthToken(
      userId,
      AuthTokenType.EMAIL_CHANGE,
      EMAIL_CHANGE_EXPIRES_IN_HOURS,
    );

    await this.authMailService.sendEmailChangeConfirmation({
      to: newEmail,
      name: user.firstName ?? user.name,
      url: this.buildWebUrl("/confirm-email-change", changeToken),
    });

    return {
      message: "Un email de confirmation a ete envoye a la nouvelle adresse.",
    };
  }

  async confirmEmailChange(token: string) {
    const authToken = await this.findValidToken(
      token,
      AuthTokenType.EMAIL_CHANGE,
    );

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: authToken.userId },
      select: { pendingEmail: true },
    });

    if (!user.pendingEmail) {
      throw new BadRequestException(
        "Aucune demande de changement d'email en cours.",
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: user.pendingEmail },
      select: { id: true },
    });

    if (existingUser && existingUser.id !== authToken.userId) {
      throw new ConflictException("Cette adresse email est deja utilisee.");
    }

    await this.prisma.$transaction([
      this.prisma.authToken.update({
        where: { id: authToken.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: authToken.userId },
        data: { email: user.pendingEmail, pendingEmail: null },
      }),
    ]);

    return { message: "Votre nouvelle adresse email est confirmee." };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    if (dto.newPassword !== dto.newPasswordConfirm) {
      throw new BadRequestException("Les mots de passe ne correspondent pas.");
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { passwordHash: true },
    });

    const isValidPassword = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException("Mot de passe actuel incorrect.");
    }

    if (dto.newPassword === dto.currentPassword) {
      throw new BadRequestException(
        "Le nouveau mot de passe doit differer de l'ancien.",
      );
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: "Mot de passe mis a jour." };
  }

  async refresh(refreshToken: string) {
    const payload = await this.jwtService.verifyAsync(refreshToken);
    return {
      accessToken: await this.jwtService.signAsync({
        sub: payload.sub,
        email: payload.email,
        roles: payload.roles ?? [],
        permissions: payload.permissions ?? [],
      }),
    };
  }

  private async createAuthToken(
    userId: string,
    type: AuthTokenType,
    expiresInHours: number,
  ) {
    const token = randomBytes(32).toString("base64url");
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.authToken.updateMany({
        where: { userId, type, usedAt: null },
        data: { usedAt: new Date() },
      }),
      this.prisma.authToken.create({
        data: { userId, type, tokenHash, expiresAt },
      }),
    ]);

    return token;
  }

  private async findValidToken(token: string, type: AuthTokenType) {
    const authToken = await this.prisma.authToken.findUnique({
      where: { tokenHash: this.hashToken(token) },
      select: {
        id: true,
        userId: true,
        type: true,
        expiresAt: true,
        usedAt: true,
      },
    });

    if (
      !authToken ||
      authToken.type !== type ||
      authToken.usedAt ||
      authToken.expiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException("Lien invalide ou expire.");
    }

    return authToken;
  }

  private hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private buildWebUrl(path: string, token: string) {
    const webUrl =
      this.configService.get<string>("WEB_URL") ?? "http://localhost:3100";
    const url = new URL(path, webUrl);
    url.searchParams.set("token", token);
    return url.toString();
  }
}
