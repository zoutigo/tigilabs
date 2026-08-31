import type {
  ChangeEmailPayload,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  UpdateProfilePayload,
  User,
} from "@tigilabs/types";
import { apiClient } from "./client";

export function login(payload: LoginPayload) {
  return authRequest<{ user: unknown }>("/api/auth/login", payload);
}

export function register(payload: RegisterPayload) {
  return authRequest<{ activationExpiresInHours: number; message: string }>(
    "/api/auth/register",
    payload,
  );
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

export function confirmEmailChange(token: string) {
  return authRequest<{ message: string }>("/api/auth/confirm-email-change", {
    token,
  });
}

export function getCurrentUser() {
  return apiClient<User>("/auth/me");
}

export function updateProfile(payload: UpdateProfilePayload) {
  return apiClient<User>("/auth/me", {
    body: JSON.stringify(payload),
    method: "PATCH",
  });
}

export function changeEmail(payload: ChangeEmailPayload) {
  return apiClient<{ message: string }>("/auth/change-email", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function changePassword(payload: ChangePasswordPayload) {
  return apiClient<{ message: string }>("/auth/change-password", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

async function authRequest<T>(path: string, payload: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
  } catch {
    throw new Error(
      "Impossible de contacter le serveur. Verifiez votre connexion et reessayez.",
    );
  }

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Une erreur est survenue.");
  }

  if (data === undefined) {
    throw new Error("Reponse invalide du serveur. Reessayez.");
  }

  return data as T;
}

async function parseJsonResponse(response: Response) {
  const text = await response.text();
  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text) as { message?: string };
  } catch {
    return undefined;
  }
}
