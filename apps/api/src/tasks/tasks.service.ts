import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { TaskStatus } from "@prisma/client";
import { CreateTaskGroupDto } from "./dto/create-task-group.dto";
import { CreateTaskProgressDto } from "./dto/create-task-progress.dto";
import { CreateTaskDto } from "./dto/create-task.dto";
import { TaskFilterDto } from "./dto/task-filter.dto";
import { UpdateTaskGroupDto } from "./dto/update-task-group.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { TasksRepository } from "./tasks.repository";

export type AuthenticatedUser = {
  id: string;
  email: string;
  roles?: string[];
  permissions?: string[];
};

const trackedTaskFields = [
  "title",
  "description",
  "startDate",
  "dueDate",
  "priority",
  "status",
  "assignedToId",
] as const;

@Injectable()
export class TasksService {
  constructor(private readonly tasksRepository: TasksRepository) {}

  async findGroups(user: AuthenticatedUser) {
    const groups = await this.tasksRepository.findGroups({
      includeArchived: this.canReadAll(user),
      userId: this.canReadAll(user) ? undefined : user.id,
    });

    return groups.map((group) => this.withGroupProgress(group));
  }

  async findGroup(id: string, user: AuthenticatedUser) {
    const group = await this.tasksRepository.findGroup(id);

    if (!group) {
      throw new NotFoundException("Task group not found");
    }

    if (!this.canReadAll(user) && !this.groupContainsUserWork(group, user.id)) {
      throw new ForbiddenException("Access denied");
    }

    return this.withGroupProgress({
      ...group,
      tasks: group.tasks.map((task) => this.withTaskState(task)),
    });
  }

  createGroup(dto: CreateTaskGroupDto, user: AuthenticatedUser) {
    return this.tasksRepository.createGroup(dto, user.id);
  }

  updateGroup(id: string, dto: UpdateTaskGroupDto) {
    return this.tasksRepository.updateGroup(id, dto);
  }

  archiveGroup(id: string) {
    return this.tasksRepository.archiveGroup(id);
  }

  async findAll(filter: TaskFilterDto, user: AuthenticatedUser) {
    const tasks = await this.tasksRepository.findAll(filter, {
      userId: user.id,
      canReadAll: this.canReadAll(user),
    });

    return tasks.map((task) => this.withTaskState(task));
  }

  findMyTasks(user: AuthenticatedUser) {
    return this.findAll(
      { my: "true", sortBy: "dueDate", sortOrder: "asc" },
      user,
    );
  }

  async dashboard(user: AuthenticatedUser) {
    const tasks = await this.findAll({}, user);
    const myTasks = tasks.filter((task) => task.assignedToId === user.id);
    const now = Date.now();
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    return {
      mine: {
        todo: myTasks.filter((task) => task.status === "TODO").length,
        inProgress: myTasks.filter((task) => task.status === "IN_PROGRESS")
          .length,
        overdue: myTasks.filter((task) => task.isOverdue).length,
        blocked: myTasks.filter((task) => task.status === "BLOCKED").length,
      },
      urgent: tasks.filter((task) => task.priority === "URGENT").slice(0, 5),
      dueSoon: tasks
        .filter(
          (task) =>
            task.status !== "DONE" &&
            task.dueDate &&
            new Date(task.dueDate).getTime() >= now &&
            new Date(task.dueDate).getTime() <=
              todayEnd.getTime() + 7 * 86400000,
        )
        .slice(0, 5),
      recentActivity: tasks
        .flatMap((task) =>
          task.history.map((event) => ({
            ...event,
            task: { id: task.id, title: task.title },
          })),
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 8),
    };
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const task = await this.tasksRepository.findOne(id);

    if (!task) {
      throw new NotFoundException("Task not found");
    }

    if (!this.canReadTask(task, user)) {
      throw new ForbiddenException("Access denied");
    }

    return this.withTaskState(task);
  }

  async create(dto: CreateTaskDto, user: AuthenticatedUser) {
    const task = await this.tasksRepository.create(dto, user.id);
    await this.tasksRepository.createHistory({
      taskId: task.id,
      userId: user.id,
      action: "TASK_CREATED",
      newValue: task.title,
    });

    return this.withTaskState(task);
  }

  async update(id: string, dto: UpdateTaskDto, user: AuthenticatedUser) {
    const before = await this.findOne(id, user);
    this.assertCanModifyTask(before, user);

    const updatedTask = await this.tasksRepository.update(id, dto);
    const task =
      dto.status === TaskStatus.DONE && before.status !== TaskStatus.DONE
        ? await this.tasksRepository.complete(id, user.id)
        : updatedTask;

    await this.recordTaskChanges(before, task, dto, user.id);

    return this.withTaskState(task);
  }

  async assign(
    id: string,
    assignedToId: string | null,
    user: AuthenticatedUser,
  ) {
    const before = await this.findOne(id, user);
    const task = await this.tasksRepository.update(id, { assignedToId });

    await this.tasksRepository.createHistory({
      taskId: id,
      userId: user.id,
      action: "ASSIGNEE_CHANGED",
      oldValue: before.assignedToId,
      newValue: assignedToId,
    });

    return this.withTaskState(task);
  }

  async complete(id: string, user: AuthenticatedUser) {
    const before = await this.findOne(id, user);
    this.assertCanModifyTask(before, user);
    const task = await this.tasksRepository.complete(id, user.id);

    await this.tasksRepository.createHistory({
      taskId: id,
      userId: user.id,
      action: "TASK_COMPLETED",
      oldValue: before.status,
      newValue: TaskStatus.DONE,
    });

    return this.withTaskState(task);
  }

  async reopen(id: string, user: AuthenticatedUser) {
    const before = await this.findOne(id, user);
    this.assertCanModifyTask(before, user);
    const task = await this.tasksRepository.reopen(id);

    await this.tasksRepository.createHistory({
      taskId: id,
      userId: user.id,
      action: "TASK_REOPENED",
      oldValue: before.status,
      newValue: TaskStatus.TODO,
    });

    return this.withTaskState(task);
  }

  async delete(id: string) {
    await this.tasksRepository.delete(id);
    return { ok: true };
  }

  async addProgress(
    id: string,
    dto: CreateTaskProgressDto,
    user: AuthenticatedUser,
  ) {
    const task = await this.findOne(id, user);
    this.assertCanModifyTask(task, user);
    const progress = await this.tasksRepository.addProgress(id, dto, user.id);

    await this.tasksRepository.createHistory({
      taskId: id,
      userId: user.id,
      action: "PROGRESS_ADDED",
      newValue: dto.content,
    });

    return progress;
  }

  private canReadAll(user: AuthenticatedUser) {
    return user.permissions?.includes("task.read-all") ?? false;
  }

  private canManageTask(user: AuthenticatedUser) {
    return (
      user.permissions?.some((permission) =>
        ["task.create", "task.assign", "task.delete"].includes(permission),
      ) ?? false
    );
  }

  private canReadTask(
    task: { assignedToId?: string | null; createdById?: string | null },
    user: AuthenticatedUser,
  ) {
    return (
      this.canReadAll(user) ||
      task.assignedToId === user.id ||
      task.createdById === user.id
    );
  }

  private assertCanModifyTask(
    task: { assignedToId?: string | null; createdById?: string | null },
    user: AuthenticatedUser,
  ) {
    if (
      this.canManageTask(user) ||
      task.assignedToId === user.id ||
      task.createdById === user.id
    ) {
      return;
    }

    throw new ForbiddenException("Access denied");
  }

  private groupContainsUserWork(
    group: {
      tasks: Array<{
        assignedToId?: string | null;
        createdById?: string | null;
      }>;
    },
    userId: string,
  ) {
    return group.tasks.some(
      (task) => task.assignedToId === userId || task.createdById === userId,
    );
  }

  private withGroupProgress<
    T extends {
      tasks: Array<{ status: string; dueDate?: Date | string | null }>;
    },
  >(group: T) {
    const totalTasks = group.tasks.length;
    const completedTasks = group.tasks.filter(
      (task) => task.status === TaskStatus.DONE,
    ).length;
    const overdueTasks = group.tasks.filter((task) =>
      this.isOverdue(task.dueDate, task.status),
    ).length;

    return {
      ...group,
      totalTasks,
      completedTasks,
      overdueTasks,
      progress: totalTasks
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0,
    };
  }

  private withTaskState<
    T extends {
      dueDate?: Date | string | null;
      status: string;
      assignedTo?: unknown | null;
    },
  >(task: T) {
    return {
      ...task,
      assignee: task.assignedTo,
      isOverdue: this.isOverdue(task.dueDate, task.status),
    };
  }

  private isOverdue(dueDate: Date | string | null | undefined, status: string) {
    return Boolean(
      dueDate &&
      new Date(dueDate).getTime() < Date.now() &&
      status !== TaskStatus.DONE,
    );
  }

  private async recordTaskChanges(
    before: Record<string, unknown>,
    after: Record<string, unknown>,
    dto: UpdateTaskDto,
    userId: string,
  ) {
    for (const field of trackedTaskFields) {
      if (!(field in dto)) {
        continue;
      }

      const oldValue = this.stringifyHistoryValue(before[field]);
      const newValue = this.stringifyHistoryValue(after[field]);

      if (oldValue === newValue) {
        continue;
      }

      await this.tasksRepository.createHistory({
        taskId: String(after.id),
        userId,
        action: this.historyActionFor(field),
        oldValue,
        newValue,
      });
    }
  }

  private historyActionFor(field: (typeof trackedTaskFields)[number]) {
    const actions: Record<(typeof trackedTaskFields)[number], string> = {
      title: "TITLE_CHANGED",
      description: "DESCRIPTION_CHANGED",
      startDate: "START_DATE_CHANGED",
      dueDate: "DUE_DATE_CHANGED",
      priority: "PRIORITY_CHANGED",
      status: "STATUS_CHANGED",
      assignedToId: "ASSIGNEE_CHANGED",
    };

    return actions[field];
  }

  private stringifyHistoryValue(value: unknown) {
    if (value instanceof Date) {
      return value.toISOString();
    }

    if (value === undefined || value === null) {
      return null;
    }

    return String(value);
  }
}
