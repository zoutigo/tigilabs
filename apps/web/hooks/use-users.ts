"use client";

import { useEffect, useState } from "react";
import type { Role, User } from "@tigilabs/types";
import { getRoles, getUsers, mockUsers } from "../lib/api/users";

export function useUsers() {
  const [users, setUsers] = useState<User[]>(mockUsers);

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch(() => setUsers(mockUsers));
  }, []);

  return { users };
}

const fallbackRoles: Role[] = [
  {
    id: "role-admin",
    name: "Admin",
    description: "Tous les droits",
  },
  {
    id: "role-manager",
    name: "Manager",
    description: "Gestion des taches et lecture utilisateurs",
  },
  {
    id: "role-member",
    name: "Member",
    description: "Utilisateur standard",
  },
];

export function useRoles() {
  const [roles, setRoles] = useState<Role[]>(fallbackRoles);

  useEffect(() => {
    getRoles()
      .then(setRoles)
      .catch(() => setRoles(fallbackRoles));
  }, []);

  return { roles };
}
