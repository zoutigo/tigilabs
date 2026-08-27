import { TaskPriority } from "../enums/task-priority.enum";
import { TaskStatus } from "../enums/task-status.enum";

export class TaskEntity {
  id!: string;
  title!: string;
  description?: string | null;
  status!: TaskStatus;
  priority!: TaskPriority;
  dueDate?: Date | null;
  assigneeId?: string | null;
  reporterId!: string;
  createdAt!: Date;
  updatedAt!: Date;
}
