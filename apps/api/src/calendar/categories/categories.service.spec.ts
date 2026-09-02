import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { AuthenticatedUser } from "../events/events.service";
import { CategoriesRepository } from "./categories.repository";
import { CategoriesService } from "./categories.service";

const repository = {
  findVisible: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const admin: AuthenticatedUser = {
  id: "admin-1",
  email: "admin@tigilabs.com",
  permissions: ["calendar.category.manage_global"],
};

const member: AuthenticatedUser = {
  id: "member-1",
  email: "member@tigilabs.com",
  permissions: [],
};

describe("CategoriesService", () => {
  let service: CategoriesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CategoriesService(
      repository as unknown as CategoriesRepository,
    );
  });

  it("creates a personal category for a regular user", async () => {
    repository.create.mockResolvedValue({ id: "cat-1" });

    await service.create({ name: "Personnel", color: "#374151" }, member);

    expect(repository.create).toHaveBeenCalledWith(
      { name: "Personnel", color: "#374151" },
      member.id,
      false,
    );
  });

  it("rejects a global category from a user without the permission", async () => {
    await expect(
      service.create(
        { name: "Global", color: "#2563EB", isGlobal: true },
        member,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("allows an admin to create a global category", async () => {
    repository.create.mockResolvedValue({ id: "cat-2" });

    await service.create(
      { name: "Global", color: "#2563EB", isGlobal: true },
      admin,
    );

    expect(repository.create).toHaveBeenCalledWith(
      expect.anything(),
      admin.id,
      true,
    );
  });

  it("throws when updating a category that does not exist", async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(
      service.update("missing", { name: "X" }, member),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("prevents a user from deleting another user's personal category", async () => {
    repository.findOne.mockResolvedValue({
      id: "cat-1",
      isGlobal: false,
      ownerId: "someone-else",
    });

    await expect(service.delete("cat-1", member)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(repository.delete).not.toHaveBeenCalled();
  });
});
