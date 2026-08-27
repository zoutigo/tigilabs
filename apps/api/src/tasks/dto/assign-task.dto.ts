import { IsOptional, IsString } from "class-validator";

export class AssignTaskDto {
  @IsString()
  @IsOptional()
  assigneeId?: string | null;
}
