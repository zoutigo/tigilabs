import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export const UserStatusDto = {
  ACTIVE: "ACTIVE",
  INVITED: "INVITED",
  DISABLED: "DISABLED",
} as const;

export type UserStatusDto = (typeof UserStatusDto)[keyof typeof UserStatusDto];

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  name!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsEnum(UserStatusDto)
  @IsOptional()
  status?: UserStatusDto;
}
