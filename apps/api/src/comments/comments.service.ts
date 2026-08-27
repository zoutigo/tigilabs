import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  findByTask(taskId: string) {
    return this.prisma.comment.findMany({
      where: { taskId },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    });
  }

  create(taskId: string, data: { content: string; userId: string }) {
    return this.prisma.comment.create({
      data: {
        taskId,
        content: data.content,
        userId: data.userId,
      },
    });
  }
}
