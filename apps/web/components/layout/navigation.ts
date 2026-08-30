import type { LucideIcon } from "lucide-react";
import {
  CheckSquare,
  CircleUserRound,
  LayoutDashboard,
  LayoutList,
  Mail,
  ScrollText,
  Settings,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";

export type NavLink = {
  href: string;
  icon: LucideIcon;
  id: string;
  label: string;
  permission?: string;
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
  {
    children: [
      {
        href: "/users",
        icon: Users,
        id: "users-list",
        label: "Liste des utilisateurs",
        permission: "user.manage",
      },
      {
        href: "/users/roles",
        icon: ShieldCheck,
        id: "users-roles",
        label: "Roles et permissions",
        permission: "role.manage",
      },
    ],
    href: "/users",
    icon: Users,
    id: "users",
    label: "Utilisateurs",
    permission: "user.manage",
  },
  { href: "/dashboard", icon: ScrollText, id: "reports", label: "Rapports" },
  {
    href: "/contacts",
    icon: Mail,
    id: "contacts",
    label: "Messages de contact",
    permission: "contact.manage",
  },
  {
    href: "/settings",
    icon: Settings,
    id: "settings",
    label: "Parametres",
    permission: "settings.manage",
  },
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

  if (child.id === "users-roles") {
    return pathname.startsWith("/users/roles");
  }

  if (child.id === "users-list") {
    return (
      pathname === "/users" ||
      (pathname.startsWith("/users/") && !pathname.startsWith("/users/roles"))
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

export function filterNavLinksByPermissions(
  links: NavEntry[],
  permissions: string[] = [],
): NavEntry[] {
  return links
    .filter((item) => !item.permission || permissions.includes(item.permission))
    .map((item) =>
      item.children
        ? {
            ...item,
            children: item.children.filter(
              (child) =>
                !child.permission || permissions.includes(child.permission),
            ),
          }
        : item,
    )
    .filter((item) => !item.children || item.children.length > 0);
}
