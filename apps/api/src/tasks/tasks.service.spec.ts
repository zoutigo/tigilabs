import { NotFoundException } from "@nestjs/common";
import { TasksService } from "./tasks.service";
import { TasksRepository } from "./tasks.repository";

const repository = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};

describe("TasksService", () => {
  let service: TasksService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TasksService(repository as unknown as TasksRepository);
  });

  it("returns all tasks from the repository", async () => {
    const tasks = [{ id: "task-1", title: "Task 1" }];
    const filter = { status: "TODO" as const };
    repository.findAll.mockResolvedValue(tasks);

    await expect(service.findAll(filter)).resolves.toBe(tasks);
    expect(repository.findAll).toHaveBeenCalledWith(filter);
  });

  it("returns one task when it exists", async () => {
    const task = { id: "task-1", title: "Task 1" };
    repository.findOne.mockResolvedValue(task);

    await expect(service.findOne("task-1")).resolves.toBe(task);
    expect(repository.findOne).toHaveBeenCalledWith("task-1");
  });

  it("throws when a task cannot be found", async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.findOne("missing-task")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("assigns a task by updating its assignee", async () => {
    const updatedTask = { id: "task-1", assigneeId: "user-1" };
    repository.update.mockResolvedValue(updatedTask);

    await expect(service.assign("task-1", "user-1")).resolves.toBe(updatedTask);
    expect(repository.update).toHaveBeenCalledWith("task-1", {
      assigneeId: "user-1",
    });
  });
});
