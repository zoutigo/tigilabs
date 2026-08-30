import { IsStrongPassword } from "class-validator";

const STRONG_PASSWORD_MESSAGE =
  "Le mot de passe doit contenir au moins 8 caracteres, une majuscule, une minuscule et un caractere special.";

/**
 * Shared password policy for register/reset/change-password DTOs: 8+ chars,
 * one lowercase, one uppercase, one special character. Mirrors the zod
 * `passwordSchema` in @tigilabs/schemas.
 */
export function IsStrongPasswordField() {
  return IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 0,
      minSymbols: 1,
    },
    { message: STRONG_PASSWORD_MESSAGE },
  );
}
