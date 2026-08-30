import type { Permission, Role, User, UserStatus } from "@tigilabs/types";
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
      "role.manage",
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

export function getPermissions() {
  return apiClient<Permission[]>("/roles/permissions");
}

export function createRole(payload: { name: string; description?: string }) {
  return apiClient<Role>("/roles", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function updateRole(
  id: string,
  payload: Partial<{ name: string; description: string }>,
) {
  return apiClient<Role>(`/roles/${id}`, {
    body: JSON.stringify(payload),
    method: "PATCH",
  });
}

export function setRolePermissions(id: string, permissionIds: string[]) {
  return apiClient<Role>(`/roles/${id}/permissions`, {
    body: JSON.stringify({ permissionIds }),
    method: "PUT",
  });
}

export function updateUser(
  id: string,
  payload: Partial<{
    email: string;
    name: string;
    roles: string[];
    status: UserStatus;
  }>,
) {
  return apiClient<User>(`/users/${id}`, {
    body: JSON.stringify(payload),
    method: "PATCH",
  });
}
