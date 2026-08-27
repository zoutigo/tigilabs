import { IsOptional, IsString } from "class-validator";

export class CreateTaskGroupDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;
}
