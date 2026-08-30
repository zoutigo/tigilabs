"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@tigilabs/types";
import { getCurrentUser } from "../../lib/api/auth";
import { mockUsers } from "../../lib/api/users";

type CurrentUserContextValue = {
  isLoading: boolean;
  refresh: () => Promise<void>;
  setUser: (user: User) => void;
  user: User;
};

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

export function CurrentUserProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [user, setUser] = useState<User>(mockUsers[0]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    setIsLoading(true);
    return getCurrentUser()
      .then(setUser)
      .catch(() => setUser(mockUsers[0]))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ isLoading, refresh, setUser, user }),
    [isLoading, refresh, user],
  );

  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const context = useContext(CurrentUserContext);

  if (!context) {
    throw new Error("useCurrentUser must be used within a CurrentUserProvider");
  }

  return context;
}
