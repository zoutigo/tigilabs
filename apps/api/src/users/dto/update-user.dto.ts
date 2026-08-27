import { IsEmail, IsEnum, IsOptional, IsString } from "class-validator";
import { UserStatusDto } from "./create-user.dto";

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(UserStatusDto)
  @IsOptional()
  status?: UserStatusDto;
}
