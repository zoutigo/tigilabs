"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "../../hooks/use-current-user";
import { logout } from "../../lib/api/auth";
import { initialsFor, roleLabelFor } from "../../lib/utils";
import { Button } from "../ui/button";

export function UserMenu() {
  const router = useRouter();
  const { user } = useCurrentUser();

  async function handleLogout() {
    await logout();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="user-menu">
      <Link
        aria-label="Mon compte"
        className="user-menu-identity"
        href="/account"
      >
        <span className="avatar avatar-photo" aria-hidden="true">
          {initialsFor(user)}
        </span>
        <span className="user-menu-copy">
          <strong>{user.name}</strong>
          <small>{roleLabelFor(user)}</small>
        </span>
      </Link>
      <Button
        aria-label="Deconnexion"
        onClick={handleLogout}
        type="button"
        variant="ghost"
      >
        <LogOut size={18} />
      </Button>
    </div>
  );
}
