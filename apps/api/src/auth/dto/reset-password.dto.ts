import { IsString, MinLength } from "class-validator";
import { IsStrongPasswordField } from "../validators/strong-password.decorator";

export class ResetPasswordDto {
  @IsString()
  token!: string;

  @IsStrongPasswordField()
  password!: string;

  @IsString()
  @MinLength(8)
  passwordConfirm!: string;
}
