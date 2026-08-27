import { UnauthorizedException } from "@nestjs/common";
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
    update: jest.fn(),
  },
};
const jwtService = {
  signAsync: jest.fn().mockResolvedValue("signed-token"),
  verifyAsync: jest.fn(),
};
const usersService = {
  findByEmail: jest.fn(),
};
const authMailService = {
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
    prisma.user.create.mockResolvedValue({
      email: "alice@example.com",
      firstName: "Alice",
      id: "user-1",
      name: "Alice Martin",
    });
    prisma.user.update.mockResolvedValue({});
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
        password: "password123",
        passwordConfirm: "password123",
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
      passwordHash: await bcrypt.hash("password123", 4),
      roles: [],
      status: UserStatus.INVITED,
    });

    await expect(
      service.login({ email: "alice@example.com", password: "password123" }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("marks an email confirmation token as used and activates the user", async () => {
    await service.register({
      email: "alice@example.com",
      firstName: "Alice",
      lastName: "Martin",
      password: "password123",
      passwordConfirm: "password123",
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
});
