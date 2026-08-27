import { IsEnum, IsIn, IsOptional, IsString } from "class-validator";
import { TaskPriority } from "../enums/task-priority.enum";
import { TaskStatus } from "../enums/task-status.enum";

export const TaskSortBy = {
  PRIORITY: "priority",
  START_DATE: "startDate",
  DUE_DATE: "dueDate",
  RESPONSIBLE: "responsible",
  STATUS: "status",
  CREATED_AT: "createdAt",
} as const;

export const TaskSortOrder = {
  ASC: "asc",
  DESC: "desc",
} as const;

export class TaskFilterDto {
  @IsString()
  @IsOptional()
  q?: string;

  @IsString()
  @IsOptional()
  groupId?: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsString()
  @IsOptional()
  assignedToId?: string;

  @IsString()
  @IsOptional()
  my?: string;

  @IsString()
  @IsOptional()
  unassigned?: string;

  @IsString()
  @IsOptional()
  overdue?: string;

  @IsString()
  @IsOptional()
  urgent?: string;

  @IsIn(Object.values(TaskSortBy))
  @IsOptional()
  sortBy?: (typeof TaskSortBy)[keyof typeof TaskSortBy];

  @IsIn(Object.values(TaskSortOrder))
  @IsOptional()
  sortOrder?: (typeof TaskSortOrder)[keyof typeof TaskSortOrder];
}
