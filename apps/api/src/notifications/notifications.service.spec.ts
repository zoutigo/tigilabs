import { NotificationsService } from "./notifications.service";
import { PrismaService } from "../database/prisma.service";

const prisma = {
  notification: {
    findMany: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    updateMany: jest.fn(),
  },
};

describe("NotificationsService", () => {
  let service: NotificationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationsService(prisma as unknown as PrismaService);
  });

  it("finds unread notifications for a user ordered by newest first", async () => {
    prisma.notification.findMany.mockResolvedValue([]);

    await service.findUnread("user-1");

    expect(prisma.notification.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1", readAt: null },
      orderBy: { createdAt: "desc" },
    });
  });

  it("creates a single notification", async () => {
    const data = { userId: "user-1", title: "Titre", body: "Corps" };
    prisma.notification.create.mockResolvedValue({ id: "notif-1", ...data });

    await service.create(data);

    expect(prisma.notification.create).toHaveBeenCalledWith({ data });
  });

  it("creates several notifications at once", async () => {
    const notifications = [
      { userId: "user-1", title: "A", body: "a" },
      { userId: "user-2", title: "A", body: "a" },
    ];

    await service.createMany(notifications);

    expect(prisma.notification.createMany).toHaveBeenCalledWith({
      data: notifications,
    });
  });

  it("skips the database call when there is nothing to create", async () => {
    await expect(service.createMany([])).resolves.toEqual({ count: 0 });
    expect(prisma.notification.createMany).not.toHaveBeenCalled();
  });

  it("marks a notification as read only for its owner", async () => {
    prisma.notification.updateMany.mockResolvedValue({ count: 1 });

    await service.markAsRead("notif-1", "user-1");

    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { id: "notif-1", userId: "user-1" },
      data: { readAt: expect.any(Date) },
    });
  });
});
