"use client";

import { useEffect, useState } from "react";
import type { User } from "@tigilabs/types";
import { getUsers, mockUsers } from "../lib/api/users";

export function useUsers() {
  const [users, setUsers] = useState<User[]>(mockUsers);

  useEffect(() => {
    getUsers().then(setUsers).catch(() => setUsers(mockUsers));
  }, []);

  return { users };
}
