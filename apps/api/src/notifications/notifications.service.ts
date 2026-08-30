import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  findUnread(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId, readAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  create(data: { userId: string; title: string; body: string }) {
    return this.prisma.notification.create({ data });
  }

  createMany(
    notifications: Array<{ userId: string; title: string; body: string }>,
  ) {
    if (!notifications.length) {
      return Promise.resolve({ count: 0 });
    }

    return this.prisma.notification.createMany({ data: notifications });
  }

  markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    });
  }
}
