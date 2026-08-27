import { IsString, MinLength } from "class-validator";

export class CreateTaskProgressDto {
  @IsString()
  @MinLength(2)
  content!: string;
}
