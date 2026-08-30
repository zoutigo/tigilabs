import { IsEmail, IsString, MinLength } from "class-validator";
import { IsStrongPasswordField } from "../validators/strong-password.decorator";

export class RegisterDto {
  @IsString()
  @MinLength(2)
  firstName!: string;

  @IsString()
  @MinLength(2)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsStrongPasswordField()
  password!: string;

  @IsString()
  @MinLength(8)
  passwordConfirm!: string;
}
