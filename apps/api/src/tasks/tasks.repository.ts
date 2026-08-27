import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { CreateTaskDto } from "./dto/create-task.dto";
import { TaskFilterDto } from "./dto/task-filter.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";

@Injectable()
export class TasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(filter: TaskFilterDto) {
    return this.prisma.task.findMany({
      where: {
        status: filter.status,
        priority: filter.priority,
        assigneeId: filter.assigneeId
      },
      include: {
        assignee: true,
        reporter: true,
        comments: true
      },
      orderBy: { updatedAt: "desc" }
    });
  }

  findOne(id: string) {
    return this.prisma.task.findUnique({
      where: { id },
      include: {
        assignee: true,
        reporter: true,
        comments: { include: { user: true }, orderBy: { createdAt: "asc" } }
      }
    });
  }

  create(dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined
      }
    });
  }

  update(id: string, dto: UpdateTaskDto) {
    return this.prisma.task.update({
      where: { id },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined
      }
    });
  }
}
