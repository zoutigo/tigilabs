import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";

const roleWithPermissions = {
  permissions: { include: { permission: true } },
};

const ROLE_MANAGE_PERMISSION = { action: "manage", subject: "role" };

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.role.findMany({
      include: roleWithPermissions,
      orderBy: { name: "asc" },
    });
  }

  findAllPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ subject: "asc" }, { action: "asc" }],
    });
  }

  async create(dto: CreateRoleDto) {
    try {
      return await this.prisma.role.create({
        data: { description: dto.description, name: dto.name },
        include: roleWithPermissions,
      });
    } catch (error) {
      throw this.mapWriteError(error);
    }
  }

  async update(id: string, dto: UpdateRoleDto) {
    await this.ensureExists(id);

    try {
      return await this.prisma.role.update({
        data: { description: dto.description, name: dto.name },
        include: roleWithPermissions,
        where: { id },
      });
    } catch (error) {
      throw this.mapWriteError(error);
    }
  }

  async setPermissions(id: string, permissionIds: string[]) {
    await this.ensureExists(id);

    const uniqueIds = Array.from(new Set(permissionIds));

    if (uniqueIds.length) {
      const found = await this.prisma.permission.findMany({
        select: { id: true },
        where: { id: { in: uniqueIds } },
      });

      if (found.length !== uniqueIds.length) {
        throw new BadRequestException(
          "Une ou plusieurs permissions sont invalides.",
        );
      }
    }

    await this.guardRoleManageLockout(id, uniqueIds);

    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId: id } }),
      this.prisma.rolePermission.createMany({
        data: uniqueIds.map((permissionId) => ({ permissionId, roleId: id })),
        skipDuplicates: true,
      }),
    ]);

    return this.prisma.role.findUniqueOrThrow({
      include: roleWithPermissions,
      where: { id },
    });
  }

  private async ensureExists(id: string) {
    const role = await this.prisma.role.findUnique({
      select: { id: true },
      where: { id },
    });

    if (!role) {
      throw new NotFoundException("Role introuvable.");
    }
  }

  private async guardRoleManageLockout(
    roleId: string,
    nextPermissionIds: string[],
  ) {
    const roleManagePermission = await this.prisma.permission.findUnique({
      where: { action_subject: ROLE_MANAGE_PERMISSION },
    });

    if (
      !roleManagePermission ||
      nextPermissionIds.includes(roleManagePermission.id)
    ) {
      return;
    }

    const hadRoleManage = await this.prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          permissionId: roleManagePermission.id,
          roleId,
        },
      },
    });

    if (!hadRoleManage) {
      return;
    }

    const otherRolesWithRoleManage = await this.prisma.role.count({
      where: {
        id: { not: roleId },
        permissions: { some: { permissionId: roleManagePermission.id } },
      },
    });

    if (otherRolesWithRoleManage === 0) {
      throw new BadRequestException(
        "Au moins un role doit conserver la permission role.manage.",
      );
    }
  }

  private mapWriteError(error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return new ConflictException("Un role avec ce nom existe deja.");
    }

    return error;
  }
}
