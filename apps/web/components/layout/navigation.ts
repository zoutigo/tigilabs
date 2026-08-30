import type { LucideIcon } from "lucide-react";
import {
  CheckSquare,
  CircleUserRound,
  LayoutDashboard,
  LayoutList,
  ScrollText,
  Settings,
  UserCheck,
  Users,
} from "lucide-react";

export type NavLink = {
  href: string;
  icon: LucideIcon;
  id: string;
  label: string;
};

export type NavEntry = NavLink & {
  children?: NavLink[];
};

export const privateNavLinks: NavEntry[] = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    id: "dashboard",
    label: "Tableau de bord",
  },
  {
    children: [
      {
        href: "/tasks",
        icon: LayoutList,
        id: "tasks-overview",
        label: "Synthese",
      },
      {
        href: "/tasks/my",
        icon: UserCheck,
        id: "tasks-mine",
        label: "Mes taches",
      },
    ],
    href: "/tasks",
    icon: CheckSquare,
    id: "tasks",
    label: "Taches",
  },
  { href: "/users", icon: Users, id: "users", label: "Utilisateurs" },
  { href: "/dashboard", icon: ScrollText, id: "reports", label: "Rapports" },
  { href: "/settings", icon: Settings, id: "settings", label: "Parametres" },
  {
    href: "/account",
    icon: CircleUserRound,
    id: "account",
    label: "Mon compte",
  },
];

export function isGroupActive(pathname: string, item: NavEntry) {
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function isChildActive(pathname: string, child: NavLink) {
  if (child.id === "tasks-mine") {
    return pathname.startsWith("/tasks/my");
  }

  if (child.id === "tasks-overview") {
    return (
      pathname === "/tasks" ||
      (pathname.startsWith("/tasks/") && !pathname.startsWith("/tasks/my"))
    );
  }

  return pathname === child.href || pathname.startsWith(`${child.href}/`);
}

export function isFlatActive(pathname: string, href: string, id: string) {
  if (id === "reports") {
    return false;
  }

  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
