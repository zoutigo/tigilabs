import type { LucideIcon } from "lucide-react";
import {
  CheckSquare,
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
];
