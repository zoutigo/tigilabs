import { IsEnum, IsOptional, IsString } from "class-validator";

export const TaskGroupStatusDto = {
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  ARCHIVED: "ARCHIVED",
} as const;

export class UpdateTaskGroupDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskGroupStatusDto)
  @IsOptional()
  status?: (typeof TaskGroupStatusDto)[keyof typeof TaskGroupStatusDto];
}
