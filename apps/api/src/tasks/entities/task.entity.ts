import { TaskPriority } from "../enums/task-priority.enum";
import { TaskStatus } from "../enums/task-status.enum";

export class TaskEntity {
  id!: string;
  title!: string;
  description?: string | null;
  status!: TaskStatus;
  priority!: TaskPriority;
  startDate!: Date;
  dueDate?: Date | null;
  completedAt?: Date | null;
  assignedToId?: string | null;
  createdById!: string;
  groupId!: string;
  createdAt!: Date;
  updatedAt!: Date;
}
