import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { RolesService } from "./roles.service";

const roleManagePermission = {
  action: "manage",
  id: "perm-role-manage",
  subject: "role",
};

function createPrismaMock() {
  return {
    permission: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    role: {
      count: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
    },
    rolePermission: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };
}

describe("RolesService", () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: RolesService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new RolesService(prisma as unknown as PrismaService);
  });

  describe("create", () => {
    it("creates a role with the given name and description", async () => {
      const role = { id: "role-1", name: "MANAGER" };
      prisma.role.create.mockResolvedValue(role);

      await expect(
        service.create({ description: "Gestion", name: "MANAGER" }),
      ).resolves.toEqual(role);
      expect(prisma.role.create).toHaveBeenCalledWith({
        data: { description: "Gestion", name: "MANAGER" },
        include: { permissions: { include: { permission: true } } },
      });
    });

    it("rejects a duplicate role name with a ConflictException", async () => {
      prisma.role.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError("duplicate", {
          clientVersion: "5.22.0",
          code: "P2002",
        }),
      );

      await expect(service.create({ name: "ADMIN" })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe("update", () => {
    it("throws NotFoundException when the role does not exist", async () => {
      prisma.role.findUnique.mockResolvedValue(null);

      await expect(
        service.update("missing", { name: "NEW" }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.role.update).not.toHaveBeenCalled();
    });

    it("renames an existing role", async () => {
      prisma.role.findUnique.mockResolvedValue({ id: "role-1" });
      const updated = { id: "role-1", name: "SUPERVISOR" };
      prisma.role.update.mockResolvedValue(updated);

      await expect(
        service.update("role-1", { name: "SUPERVISOR" }),
      ).resolves.toEqual(updated);
      expect(prisma.role.update).toHaveBeenCalledWith({
        data: { description: undefined, name: "SUPERVISOR" },
        include: { permissions: { include: { permission: true } } },
        where: { id: "role-1" },
      });
    });

    it("rejects a rename that collides with another role name", async () => {
      prisma.role.findUnique.mockResolvedValue({ id: "role-1" });
      prisma.role.update.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError("duplicate", {
          clientVersion: "5.22.0",
          code: "P2002",
        }),
      );

      await expect(
        service.update("role-1", { name: "ADMIN" }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe("setPermissions", () => {
    it("throws NotFoundException when the role does not exist", async () => {
      prisma.role.findUnique.mockResolvedValue(null);

      await expect(
        service.setPermissions("missing", ["perm-1"]),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("rejects unknown permission ids", async () => {
      prisma.role.findUnique.mockResolvedValue({ id: "role-1" });
      prisma.permission.findMany.mockResolvedValue([{ id: "perm-1" }]);

      await expect(
        service.setPermissions("role-1", ["perm-1", "perm-unknown"]),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("replaces the permission set for a role", async () => {
      prisma.role.findUnique.mockResolvedValue({ id: "role-1" });
      prisma.permission.findMany.mockResolvedValue([
        { id: "perm-1" },
        { id: "perm-2" },
      ]);
      prisma.permission.findUnique.mockResolvedValue(roleManagePermission);
      prisma.rolePermission.findUnique.mockResolvedValue(null);
      prisma.$transaction.mockResolvedValue([]);
      const updatedRole = { id: "role-1", permissions: [] };
      prisma.role.findUniqueOrThrow.mockResolvedValue(updatedRole);

      await expect(
        service.setPermissions("role-1", ["perm-1", "perm-2", "perm-1"]),
      ).resolves.toEqual(updatedRole);
      expect(prisma.rolePermission.deleteMany).toHaveBeenCalledWith({
        where: { roleId: "role-1" },
      });
      expect(prisma.rolePermission.createMany).toHaveBeenCalledWith({
        data: [
          { permissionId: "perm-1", roleId: "role-1" },
          { permissionId: "perm-2", roleId: "role-1" },
        ],
        skipDuplicates: true,
      });
    });

    it("blocks removing role.manage when no other role would keep it", async () => {
      prisma.role.findUnique.mockResolvedValue({ id: "role-1" });
      prisma.permission.findMany.mockResolvedValue([{ id: "perm-1" }]);
      prisma.permission.findUnique.mockResolvedValue(roleManagePermission);
      prisma.rolePermission.findUnique.mockResolvedValue({
        permissionId: roleManagePermission.id,
        roleId: "role-1",
      });
      prisma.role.count.mockResolvedValue(0);

      await expect(
        service.setPermissions("role-1", ["perm-1"]),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("allows removing role.manage when another role still holds it", async () => {
      prisma.role.findUnique.mockResolvedValue({ id: "role-1" });
      prisma.permission.findMany.mockResolvedValue([{ id: "perm-1" }]);
      prisma.permission.findUnique.mockResolvedValue(roleManagePermission);
      prisma.rolePermission.findUnique.mockResolvedValue({
        permissionId: roleManagePermission.id,
        roleId: "role-1",
      });
      prisma.role.count.mockResolvedValue(1);
      prisma.$transaction.mockResolvedValue([]);
      prisma.role.findUniqueOrThrow.mockResolvedValue({ id: "role-1" });

      await expect(
        service.setPermissions("role-1", ["perm-1"]),
      ).resolves.toEqual({ id: "role-1" });
    });
  });
});
