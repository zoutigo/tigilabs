import type {
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
} from "@tigilabs/types";

export function login(payload: LoginPayload) {
  return authRequest<{ user: unknown }>("/api/auth/login", payload);
}

export function register(payload: RegisterPayload) {
  return authRequest<{ message: string }>("/api/auth/register", payload);
}

export function confirmEmail(token: string) {
  return authRequest<{ message: string }>("/api/auth/confirm-email", {
    token,
  });
}

export function forgotPassword(payload: ForgotPasswordPayload) {
  return authRequest<{ message: string }>("/api/auth/forgot-password", payload);
}

export function resetPassword(payload: ResetPasswordPayload) {
  return authRequest<{ message: string }>("/api/auth/reset-password", payload);
}

export function logout() {
  return authRequest<{ ok: boolean }>("/api/auth/logout", {});
}

async function authRequest<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(path, {
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? "Une erreur est survenue.");
  }

  return data as T;
}
