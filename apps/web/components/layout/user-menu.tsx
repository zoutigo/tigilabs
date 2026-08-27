"use client";

import { LogOut, UserCircle } from "lucide-react";
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
    <div className="user-menu button-row" style={{ marginTop: 0 }}>
      <UserCircle size={22} />
      <span>Admin</span>
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
