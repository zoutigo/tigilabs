import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { TasksRepository } from "./tasks.repository";
import { AuthenticatedUser, TasksService } from "./tasks.service";

const repository = {
  addProgress: jest.fn(),
  archiveGroup: jest.fn(),
  complete: jest.fn(),
  create: jest.fn(),
  createGroup: jest.fn(),
  createHistory: jest.fn(),
  delete: jest.fn(),
  findAll: jest.fn(),
  findGroups: jest.fn(),
  findGroup: jest.fn(),
  findOne: jest.fn(),
  reopen: jest.fn(),
  update: jest.fn(),
  updateGroup: jest.fn(),
};

const manager: AuthenticatedUser = {
  email: "manager@tigilabs.com",
  id: "user-manager",
  permissions: ["task.read-all", "task.assign", "task.create"],
};

const member: AuthenticatedUser = {
  email: "member@tigilabs.com",
  id: "user-member",
  permissions: [],
};

describe("TasksService", () => {
  let service: TasksService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TasksService(repository as unknown as TasksRepository);
  });

  it("returns all tasks from the repository with read-all scope", async () => {
    const tasks = [{ id: "task-1", title: "Task 1", status: "TODO" }];
    const filter = { status: "TODO" as const };
    repository.findAll.mockResolvedValue(tasks);

    await expect(service.findAll(filter, manager)).resolves.toEqual([
      { ...tasks[0], assignee: undefined, isOverdue: false },
    ]);
    expect(repository.findAll).toHaveBeenCalledWith(filter, {
      canReadAll: true,
      userId: "user-manager",
    });
  });

  it("returns one task when the current user can access it", async () => {
    const task = {
      assignedToId: "user-member",
      createdById: "user-manager",
      id: "task-1",
      status: "TODO",
      title: "Task 1",
    };
    repository.findOne.mockResolvedValue(task);

    await expect(service.findOne("task-1", member)).resolves.toEqual({
      ...task,
      assignee: undefined,
      isOverdue: false,
    });
  });

  it("throws when a task cannot be found", async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(
      service.findOne("missing-task", manager),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("rejects access when a standard user is unrelated to the task", async () => {
    repository.findOne.mockResolvedValue({
      assignedToId: "other-user",
      createdById: "user-manager",
      id: "task-1",
      status: "TODO",
    });

    await expect(service.findOne("task-1", member)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it("assigns a task and records history", async () => {
    const before = {
      assignedToId: "user-member",
      createdById: "user-manager",
      id: "task-1",
      status: "TODO",
    };
    const updatedTask = { ...before, assignedToId: "user-next" };
    repository.findOne.mockResolvedValue(before);
    repository.update.mockResolvedValue(updatedTask);
    repository.createHistory.mockResolvedValue({});

    await expect(
      service.assign("task-1", "user-next", manager),
    ).resolves.toEqual({
      ...updatedTask,
      assignee: undefined,
      isOverdue: false,
    });
    expect(repository.update).toHaveBeenCalledWith("task-1", {
      assignedToId: "user-next",
    });
    expect(repository.createHistory).toHaveBeenCalledWith({
      action: "ASSIGNEE_CHANGED",
      newValue: "user-next",
      oldValue: "user-member",
      taskId: "task-1",
      userId: "user-manager",
    });
  });

  it("marks an assigned task as complete", async () => {
    const before = {
      assignedToId: "user-member",
      createdById: "user-manager",
      id: "task-1",
      status: "IN_PROGRESS",
    };
    const updatedTask = {
      ...before,
      completedAt: new Date(),
      status: "DONE",
    };
    repository.findOne.mockResolvedValue(before);
    repository.complete.mockResolvedValue(updatedTask);
    repository.createHistory.mockResolvedValue({});

    await expect(service.complete("task-1", member)).resolves.toEqual({
      ...updatedTask,
      assignee: undefined,
      isOverdue: false,
    });
    expect(repository.complete).toHaveBeenCalledWith("task-1", "user-member");
    expect(repository.createHistory).toHaveBeenCalledWith({
      action: "TASK_COMPLETED",
      newValue: "DONE",
      oldValue: "IN_PROGRESS",
      taskId: "task-1",
      userId: "user-member",
    });
  });
});
