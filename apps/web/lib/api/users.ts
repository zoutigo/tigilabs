import type { Role, User } from "@tigilabs/types";
import { apiClient } from "./client";

export const mockUsers: User[] = [
  {
    id: "user-admin",
    name: "Admin Tigilabs",
    email: "admin@tigilabs.com",
    role: "Admin",
    roles: ["Admin"],
    permissions: [
      "task.create",
      "task.assign",
      "task.read-all",
      "task.delete",
      "user.read",
      "user.create",
      "user.manage",
    ],
    status: "ACTIVE",
  },
  {
    id: "user-manager",
    name: "Responsable Operations",
    email: "ops@tigilabs.com",
    role: "Manager",
    roles: ["Manager"],
    permissions: ["task.create", "task.assign", "task.read-all", "user.read"],
    status: "ACTIVE",
  },
  {
    id: "user-member",
    name: "Equipe Produit",
    email: "product@tigilabs.com",
    role: "Member",
    roles: ["Member"],
    permissions: ["user.read"],
    status: "ACTIVE",
  },
];

export function getUsers() {
  return apiClient<User[]>("/users");
}

export function getRoles() {
  return apiClient<Role[]>("/roles");
}

export function createUser(payload: {
  email: string;
  firstName?: string;
  lastName?: string;
  name: string;
  password: string;
  roles?: string[];
  status?: "ACTIVE" | "INVITED" | "DISABLED";
}) {
  return apiClient<User>("/users", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function updateUser(
  id: string,
  payload: Partial<{
    email: string;
    name: string;
    roles: string[];
    status: "ACTIVE" | "INVITED" | "DISABLED";
  }>,
) {
  return apiClient<User>(`/users/${id}`, {
    body: JSON.stringify(payload),
    method: "PATCH",
  });
}
