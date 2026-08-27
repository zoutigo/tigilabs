"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { logout } from "../../lib/api/auth";
import { Button } from "../ui/button";

export function UserMenu() {
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="user-menu">
      <span className="avatar avatar-photo" aria-hidden="true">
        VM
      </span>
      <span className="user-menu-copy">
        <strong>Valery M.</strong>
        <small>Administrateur</small>
      </span>
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
