import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../database/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

const publicUserSelection = {
  id: true,
  email: true,
  pendingEmail: true,
  firstName: true,
  lastName: true,
  name: true,
  status: true,
  emailVerifiedAt: true,
  createdAt: true,
  updatedAt: true,
  roles: {
    include: {
      role: { include: { permissions: { include: { permission: true } } } },
    },
  },
};

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      select: publicUserSelection,
      orderBy: { createdAt: "desc" },
    });
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: publicUserSelection,
    });
  }

  findApprovers() {
    return this.prisma.user.findMany({
      where: {
        status: "ACTIVE",
        roles: {
          some: {
            role: {
              permissions: {
                some: {
                  permission: { subject: "user", action: "manage" },
                },
              },
            },
          },
        },
      },
      select: { id: true, email: true, firstName: true, name: true },
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: {
              include: { permissions: { include: { permission: true } } },
            },
          },
        },
      },
    });
  }

  async create(dto: CreateUserDto) {
    const { password, roles, ...data } = dto;
    const passwordHash = await bcrypt.hash(password, 12);

    return this.prisma.$transaction(async (prisma) => {
      const user = await prisma.user.create({
        data: {
          ...data,
          passwordHash,
        },
        select: { id: true },
      });

      await this.replaceRoles(prisma, user.id, roles);

      return prisma.user.findUniqueOrThrow({
        where: { id: user.id },
        select: publicUserSelection,
      });
    });
  }

  update(id: string, dto: UpdateUserDto) {
    const { roles, ...data } = dto;

    return this.prisma.$transaction(async (prisma) => {
      await prisma.user.update({
        where: { id },
        data,
        select: { id: true },
      });

      await this.replaceRoles(prisma, id, roles);

      return prisma.user.findUniqueOrThrow({
        where: { id },
        select: publicUserSelection,
      });
    });
  }

  private async replaceRoles(
    prisma: Prisma.TransactionClient,
    userId: string,
    roles?: string[],
  ) {
    if (!roles) {
      return;
    }

    const roleRows = await prisma.role.findMany({
      where: { name: { in: roles } },
      select: { id: true },
    });

    await prisma.userRole.deleteMany({ where: { userId } });

    if (roleRows.length) {
      await prisma.userRole.createMany({
        data: roleRows.map((role) => ({ roleId: role.id, userId })),
        skipDuplicates: true,
      });
    }
  }
}
