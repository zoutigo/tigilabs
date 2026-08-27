import type { User } from "@tigilabs/types";
import { apiClient } from "./client";

export const mockUsers: User[] = [
  {
    id: "user-admin",
    name: "Admin Tigilabs",
    email: "admin@tigilabs.com",
    role: "Admin",
    status: "ACTIVE",
  },
  {
    id: "user-manager",
    name: "Responsable Operations",
    email: "ops@tigilabs.com",
    role: "Manager",
    status: "ACTIVE",
  },
  {
    id: "user-member",
    name: "Equipe Produit",
    email: "product@tigilabs.com",
    role: "Member",
    status: "INVITED",
  },
];

export function getUsers() {
  return apiClient<User[]>("/users");
}
