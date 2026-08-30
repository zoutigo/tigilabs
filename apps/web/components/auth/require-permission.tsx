"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useCurrentUser } from "../../hooks/use-current-user";
import { hasPermission } from "../../lib/utils";

export function RequirePermission({
  children,
  permission,
}: Readonly<{ children: ReactNode; permission: string }>) {
  const { isLoading, user } = useCurrentUser();
  const router = useRouter();
  const allowed = hasPermission(user, permission);

  useEffect(() => {
    if (!isLoading && !allowed) {
      router.replace("/dashboard");
    }
  }, [allowed, isLoading, router]);

  if (isLoading || !allowed) {
    return null;
  }

  return <>{children}</>;
}
