import type { AuthSession, LoginPayload } from "@tigilabs/types";
import { apiClient } from "./client";

export function login(payload: LoginPayload) {
  return apiClient<AuthSession>("/auth/login", {
    body: JSON.stringify(payload),
    method: "POST"
  });
}
