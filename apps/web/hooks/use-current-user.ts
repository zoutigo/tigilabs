"use client";

import { mockUsers } from "../lib/api/users";

export function useCurrentUser() {
  return { user: mockUsers[0] };
}
