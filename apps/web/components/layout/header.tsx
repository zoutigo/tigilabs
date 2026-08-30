"use client";

import { Bell, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { useUnreadNotifications } from "../../hooks/use-unread-notifications";
import { TigilabsLogo } from "./brand-logo";
import { MobileMenu } from "./mobile-menu";
import { UserMenu } from "./user-menu";

export function Header() {
  const pathname = usePathname();
  const { notifications } = useUnreadNotifications();

  return (
    <header className="header">
      <MobileMenu />
      <div className="header-title">
        <h1>{titleFromPath(pathname)}</h1>
      </div>
      <div className="header-logo">
        <TigilabsLogo compact href="/dashboard" />
      </div>
      <label className="header-search">
        <Search size={16} />
        <input aria-label="Rechercher" placeholder="Rechercher..." />
      </label>
      <button aria-label="Notifications" className="icon-button" type="button">
        <Bell size={18} />
        {notifications.length > 0 ? (
          <span className="notification-dot">{notifications.length}</span>
        ) : null}
      </button>
      <UserMenu />
    </header>
  );
}

function titleFromPath(pathname: string) {
  if (pathname.startsWith("/tasks/my")) {
    return "Mes taches";
  }

  if (pathname.startsWith("/tasks/new")) {
    return "Nouvelle tache";
  }

  if (pathname.startsWith("/tasks")) {
    return "Taches";
  }

  if (pathname.startsWith("/users/roles")) {
    return "Roles et permissions";
  }

  if (pathname.startsWith("/users")) {
    return "Utilisateurs";
  }

  if (pathname.startsWith("/contacts")) {
    return "Messages de contact";
  }

  if (pathname.startsWith("/settings")) {
    return "Parametres";
  }

  if (pathname.startsWith("/account")) {
    return "Mon compte";
  }

  return "Tableau de bord";
}
