import { IsOptional, IsString, MinLength } from "class-validator";

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
