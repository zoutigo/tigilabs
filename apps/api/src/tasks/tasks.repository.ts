import { Injectable } from "@nestjs/common";
import { Prisma, TaskStatus } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { CreateTaskGroupDto } from "./dto/create-task-group.dto";
import { CreateTaskProgressDto } from "./dto/create-task-progress.dto";
import { CreateTaskDto } from "./dto/create-task.dto";
import { TaskFilterDto } from "./dto/task-filter.dto";
import { UpdateTaskGroupDto } from "./dto/update-task-group.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";

const publicUserSelection = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  name: true,
  status: true,
};

const taskInclude = {
  group: true,
  assignedTo: { select: publicUserSelection },
  createdBy: { select: publicUserSelection },
  completedBy: { select: publicUserSelection },
  progress: {
    include: { author: { select: publicUserSelection } },
    orderBy: { createdAt: "asc" as const },
  },
  history: {
    include: { user: { select: publicUserSelection } },
    orderBy: { createdAt: "asc" as const },
  },
};

@Injectable()
export class TasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  findGroups(options: { includeArchived?: boolean; userId?: string }) {
    return this.prisma.taskGroup.findMany({
      where: {
        status: options.includeArchived ? undefined : { not: "ARCHIVED" },
        tasks: options.userId
          ? {
              some: {
                OR: [
                  { assignedToId: options.userId },
                  { createdById: options.userId },
                ],
              },
            }
          : undefined,
      },
      include: {
        createdBy: { select: publicUserSelection },
        tasks: {
          select: {
            id: true,
            status: true,
            dueDate: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    });
  }

  findGroup(id: string) {
    return this.prisma.taskGroup.findUnique({
      where: { id },
      include: {
        createdBy: { select: publicUserSelection },
        tasks: { include: taskInclude, orderBy: { createdAt: "desc" } },
      },
    });
  }

  createGroup(dto: CreateTaskGroupDto, userId: string) {
    return this.prisma.taskGroup.create({
      data: {
        ...dto,
        createdById: userId,
      },
      include: {
        createdBy: { select: publicUserSelection },
        tasks: true,
      },
    });
  }

  updateGroup(id: string, dto: UpdateTaskGroupDto) {
    return this.prisma.taskGroup.update({
      where: { id },
      data: {
        ...dto,
        archivedAt:
          dto.status === "ARCHIVED"
            ? new Date()
            : dto.status === "ACTIVE"
              ? null
              : undefined,
      },
      include: {
        createdBy: { select: publicUserSelection },
        tasks: true,
      },
    });
  }

  archiveGroup(id: string) {
    return this.updateGroup(id, { status: "ARCHIVED" });
  }

  findAll(
    filter: TaskFilterDto,
    options: { userId: string; canReadAll: boolean },
  ) {
    const where = this.buildTaskWhere(filter, options);

    return this.prisma.task.findMany({
      where,
      include: taskInclude,
      orderBy: this.buildOrderBy(filter),
    });
  }

  findOne(id: string) {
    return this.prisma.task.findUnique({
      where: { id },
      include: taskInclude,
    });
  }

  create(dto: CreateTaskDto, userId: string) {
    return this.prisma.task.create({
      data: {
        groupId: dto.groupId,
        title: dto.title,
        description: dto.description,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        priority: dto.priority,
        status: dto.status,
        assignedToId: dto.assignedToId ?? undefined,
        createdById: userId,
        completedAt: dto.status === TaskStatus.DONE ? new Date() : undefined,
        completedById: dto.status === TaskStatus.DONE ? userId : undefined,
      },
      include: taskInclude,
    });
  }

  update(id: string, dto: UpdateTaskDto) {
    return this.prisma.task.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        priority: dto.priority,
        status: dto.status,
        assignedToId: dto.assignedToId,
      },
      include: taskInclude,
    });
  }

  complete(id: string, userId: string) {
    return this.prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.DONE,
        completedAt: new Date(),
        completedById: userId,
      },
      include: taskInclude,
    });
  }

  reopen(id: string) {
    return this.prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.TODO,
        completedAt: null,
        completedById: null,
      },
      include: taskInclude,
    });
  }

  delete(id: string) {
    return this.prisma.task.delete({ where: { id } });
  }

  addProgress(taskId: string, dto: CreateTaskProgressDto, authorId: string) {
    return this.prisma.taskProgress.create({
      data: {
        taskId,
        authorId,
        content: dto.content,
      },
      include: { author: { select: publicUserSelection } },
    });
  }

  createHistory(data: {
    taskId: string;
    userId: string;
    action: string;
    oldValue?: string | null;
    newValue?: string | null;
  }) {
    return this.prisma.taskHistory.create({ data });
  }

  private buildTaskWhere(
    filter: TaskFilterDto,
    options: { userId: string; canReadAll: boolean },
  ): Prisma.TaskWhereInput {
    const clauses: Prisma.TaskWhereInput[] = [];

    if (!options.canReadAll) {
      clauses.push({
        OR: [{ assignedToId: options.userId }, { createdById: options.userId }],
      });
    }

    if (filter.q) {
      clauses.push({
        OR: [
          { title: { contains: filter.q, mode: "insensitive" } },
          { description: { contains: filter.q, mode: "insensitive" } },
          { group: { name: { contains: filter.q, mode: "insensitive" } } },
          { assignedTo: { name: { contains: filter.q, mode: "insensitive" } } },
        ],
      });
    }

    if (filter.my === "true") {
      clauses.push({ assignedToId: options.userId });
    }

    if (filter.unassigned === "true") {
      clauses.push({ assignedToId: null });
    }

    if (filter.overdue === "true") {
      clauses.push({
        dueDate: { lt: new Date() },
        status: { not: TaskStatus.DONE },
      });
    }

    if (filter.urgent === "true") {
      clauses.push({ priority: "URGENT" });
    }

    return {
      groupId: filter.groupId,
      status: filter.status as TaskStatus | undefined,
      priority: filter.priority,
      assignedToId: filter.assignedToId,
      AND: clauses.length ? clauses : undefined,
    };
  }

  private buildOrderBy(
    filter: TaskFilterDto,
  ): Prisma.TaskOrderByWithRelationInput[] {
    const order = filter.sortOrder ?? "desc";

    if (filter.sortBy === "responsible") {
      return [{ assignedTo: { name: order } }, { createdAt: "desc" }];
    }

    if (filter.sortBy) {
      return [{ [filter.sortBy]: order }, { createdAt: "desc" }];
    }

    return [{ updatedAt: "desc" }];
  }
}
