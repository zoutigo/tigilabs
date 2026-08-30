import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AuthTokenType, UserStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../database/prisma.service";
import { UsersService } from "../users/users.service";
import { AuthMailService } from "./auth-mail.service";
import { AuthService } from "./auth.service";

const prisma = {
  $transaction: jest.fn((operations: Array<Promise<unknown>>) =>
    Promise.all(operations),
  ),
  authToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    update: jest.fn(),
  },
};
const jwtService = {
  signAsync: jest.fn().mockResolvedValue("signed-token"),
  verifyAsync: jest.fn(),
};
const usersService = {
  findByEmail: jest.fn(),
  findOne: jest.fn(),
};
const authMailService = {
  sendEmailChangeConfirmation: jest.fn(),
  sendEmailConfirmation: jest.fn(),
  sendPasswordReset: jest.fn(),
};
const configService = {
  get: jest.fn((key: string) =>
    key === "WEB_URL" ? "http://localhost:3100" : undefined,
  ),
};

describe("AuthService", () => {
  let service: AuthService;
  const authTokens: Array<{
    expiresAt: Date;
    id: string;
    tokenHash: string;
    type: AuthTokenType;
    usedAt: Date | null;
    userId: string;
  }> = [];

  beforeEach(() => {
    jest.clearAllMocks();
    authTokens.length = 0;
    service = new AuthService(
      jwtService as unknown as JwtService,
      usersService as unknown as UsersService,
      prisma as unknown as PrismaService,
      authMailService as unknown as AuthMailService,
      configService as unknown as ConfigService,
    );

    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.findUniqueOrThrow.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      email: "alice@example.com",
      firstName: "Alice",
      id: "user-1",
      name: "Alice Martin",
    });
    prisma.user.update.mockResolvedValue({});
    usersService.findOne.mockResolvedValue({
      email: "alice@example.com",
      firstName: "Alice",
      id: "user-1",
      lastName: "Martin",
      name: "Alice Martin",
      status: UserStatus.ACTIVE,
    });
    prisma.authToken.update.mockResolvedValue({});
    prisma.authToken.updateMany.mockImplementation(({ where }) => {
      authTokens
        .filter(
          (token) =>
            token.userId === where.userId &&
            token.type === where.type &&
            token.usedAt === null,
        )
        .forEach((token) => {
          token.usedAt = new Date();
        });
      return Promise.resolve({ count: 1 });
    });
    prisma.authToken.create.mockImplementation(({ data }) => {
      const token = {
        expiresAt: data.expiresAt,
        id: "token-1",
        tokenHash: data.tokenHash,
        type: data.type,
        usedAt: null,
        userId: data.userId,
      };
      authTokens.push(token);
      return Promise.resolve(token);
    });
    prisma.authToken.findUnique.mockImplementation(({ where }) =>
      Promise.resolve(
        authTokens.find((token) => token.tokenHash === where.tokenHash) ?? null,
      ),
    );
  });

  it("registers an invited user and sends a confirmation email", async () => {
    await expect(
      service.register({
        email: "Alice@Example.com",
        firstName: "Alice",
        lastName: "Martin",
        password: "Password123!",
        passwordConfirm: "Password123!",
      }),
    ).resolves.toEqual({
      activationExpiresInHours: 24,
      message: "Compte cree. Confirmez votre adresse email pour l'activer.",
    });

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "alice@example.com",
          firstName: "Alice",
          lastName: "Martin",
          name: "Alice Martin",
          status: UserStatus.INVITED,
        }),
      }),
    );
    expect(authMailService.sendEmailConfirmation).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "alice@example.com",
        url: expect.stringContaining("http://localhost:3100/confirm-email"),
      }),
    );
  });

  it("rejects login until the email is confirmed", async () => {
    usersService.findByEmail.mockResolvedValue({
      email: "alice@example.com",
      id: "user-1",
      name: "Alice Martin",
      passwordHash: await bcrypt.hash("Password123!", 4),
      roles: [],
      status: UserStatus.INVITED,
    });

    await expect(
      service.login({ email: "alice@example.com", password: "Password123!" }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("marks an email confirmation token as used and activates the user", async () => {
    await service.register({
      email: "alice@example.com",
      firstName: "Alice",
      lastName: "Martin",
      password: "Password123!",
      passwordConfirm: "Password123!",
    });
    const url = authMailService.sendEmailConfirmation.mock.calls[0][0].url;
    const token = new URL(url).searchParams.get("token");

    await expect(service.confirmEmail(token ?? "")).resolves.toEqual({
      message: "Email confirme. Vous pouvez maintenant vous connecter.",
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      data: { status: UserStatus.ACTIVE },
      where: { id: "user-1" },
    });
  });

  it("sends password reset emails only for active users", async () => {
    prisma.user.findUnique.mockResolvedValue({
      email: "alice@example.com",
      firstName: "Alice",
      id: "user-1",
      name: "Alice Martin",
      status: UserStatus.ACTIVE,
    });

    await service.forgotPassword("alice@example.com");

    expect(authMailService.sendPasswordReset).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "alice@example.com",
        url: expect.stringContaining("http://localhost:3100/reset-password"),
      }),
    );
  });

  describe("updateProfile", () => {
    it("recomputes the display name from the updated first/last name", async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValueOnce({
        firstName: "Alice",
        lastName: "Martin",
      });

      await service.updateProfile("user-1", { firstName: "Alicia" });

      expect(prisma.user.update).toHaveBeenCalledWith({
        data: {
          firstName: "Alicia",
          lastName: undefined,
          name: "Alicia Martin",
        },
        where: { id: "user-1" },
      });
      expect(usersService.findOne).toHaveBeenCalledWith("user-1");
    });
  });

  describe("changeEmail", () => {
    const passwordHash = bcrypt.hashSync("Password123!", 4);

    it("stores the pending email and sends a confirmation link to the new address", async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValueOnce({
        email: "alice@example.com",
        firstName: "Alice",
        name: "Alice Martin",
        passwordHash,
      });
      prisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.changeEmail("user-1", {
          currentPassword: "Password123!",
          newEmail: "Alice.New@Example.com",
        }),
      ).resolves.toEqual({
        message: "Un email de confirmation a ete envoye a la nouvelle adresse.",
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        data: { pendingEmail: "alice.new@example.com" },
        where: { id: "user-1" },
      });
      expect(authMailService.sendEmailChangeConfirmation).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "alice.new@example.com",
          url: expect.stringContaining(
            "http://localhost:3100/confirm-email-change",
          ),
        }),
      );
    });

    it("rejects an incorrect current password", async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValueOnce({
        email: "alice@example.com",
        passwordHash,
      });

      await expect(
        service.changeEmail("user-1", {
          currentPassword: "wrong",
          newEmail: "alice.new@example.com",
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("rejects an email already used by another account", async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValueOnce({
        email: "alice@example.com",
        passwordHash,
      });
      prisma.user.findUnique.mockResolvedValueOnce({ id: "user-2" });

      await expect(
        service.changeEmail("user-1", {
          currentPassword: "Password123!",
          newEmail: "taken@example.com",
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it("rejects a new email identical to the current one", async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValueOnce({
        email: "alice@example.com",
        passwordHash,
      });

      await expect(
        service.changeEmail("user-1", {
          currentPassword: "Password123!",
          newEmail: "alice@example.com",
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe("confirmEmailChange", () => {
    it("promotes the pending email once the token is valid", async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValueOnce({
        email: "alice@example.com",
        firstName: "Alice",
        name: "Alice Martin",
        passwordHash: bcrypt.hashSync("Password123!", 4),
      });
      prisma.user.findUnique.mockResolvedValueOnce(null);
      await service.changeEmail("user-1", {
        currentPassword: "Password123!",
        newEmail: "alice.new@example.com",
      });
      const url = authMailService.sendEmailChangeConfirmation.mock.calls[0][0]
        .url as string;
      const token = new URL(url).searchParams.get("token");

      prisma.user.findUniqueOrThrow.mockResolvedValueOnce({
        pendingEmail: "alice.new@example.com",
      });
      prisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(service.confirmEmailChange(token ?? "")).resolves.toEqual({
        message: "Votre nouvelle adresse email est confirmee.",
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        data: { email: "alice.new@example.com", pendingEmail: null },
        where: { id: "user-1" },
      });
    });

    it("rejects a token with no pending email change", async () => {
      authTokens.push({
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        id: "token-2",
        tokenHash: "irrelevant",
        type: AuthTokenType.EMAIL_CHANGE,
        usedAt: null,
        userId: "user-1",
      });
      prisma.authToken.findUnique.mockImplementationOnce(() =>
        Promise.resolve(authTokens[authTokens.length - 1]),
      );
      prisma.user.findUniqueOrThrow.mockResolvedValueOnce({
        pendingEmail: null,
      });

      await expect(
        service.confirmEmailChange("any-token"),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe("changePassword", () => {
    const passwordHash = bcrypt.hashSync("Password123!", 4);

    it("updates the password hash when the current password matches", async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValueOnce({ passwordHash });

      await expect(
        service.changePassword("user-1", {
          currentPassword: "Password123!",
          newPassword: "NewPassword123!",
          newPasswordConfirm: "NewPassword123!",
        }),
      ).resolves.toEqual({ message: "Mot de passe mis a jour." });

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "user-1" } }),
      );
    });

    it("rejects an incorrect current password", async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValueOnce({ passwordHash });

      await expect(
        service.changePassword("user-1", {
          currentPassword: "wrong",
          newPassword: "NewPassword123!",
          newPasswordConfirm: "NewPassword123!",
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("rejects mismatched confirmation", async () => {
      await expect(
        service.changePassword("user-1", {
          currentPassword: "Password123!",
          newPassword: "NewPassword123!",
          newPasswordConfirm: "Different123!",
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("rejects a new password identical to the current one", async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValueOnce({ passwordHash });

      await expect(
        service.changePassword("user-1", {
          currentPassword: "Password123!",
          newPassword: "Password123!",
          newPasswordConfirm: "Password123!",
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
