import { IsString, MinLength } from "class-validator";
import { IsStrongPasswordField } from "../validators/strong-password.decorator";

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  currentPassword!: string;

  @IsStrongPasswordField()
  newPassword!: string;

  @IsString()
  @MinLength(8)
  newPasswordConfirm!: string;
}
