import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateTaskDto } from "./dto/create-task.dto";
import { TaskFilterDto } from "./dto/task-filter.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { TasksRepository } from "./tasks.repository";

@Injectable()
export class TasksService {
  constructor(private readonly tasksRepository: TasksRepository) {}

  findAll(filter: TaskFilterDto) {
    return this.tasksRepository.findAll(filter);
  }

  async findOne(id: string) {
    const task = await this.tasksRepository.findOne(id);

    if (!task) {
      throw new NotFoundException("Task not found");
    }

    return task;
  }

  create(dto: CreateTaskDto) {
    return this.tasksRepository.create(dto);
  }

  update(id: string, dto: UpdateTaskDto) {
    return this.tasksRepository.update(id, dto);
  }

  assign(id: string, assigneeId: string | null) {
    return this.tasksRepository.update(id, { assigneeId });
  }
}
