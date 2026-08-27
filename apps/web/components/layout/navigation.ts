import {
  CalendarDays,
  CheckSquare,
  LayoutDashboard,
  ScrollText,
  Settings,
  UserCheck,
  Users,
} from "lucide-react";

export const privateNavLinks = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    id: "dashboard",
    label: "Tableau de bord",
  },
  { href: "/tasks", icon: CheckSquare, id: "tasks", label: "Taches" },
  { href: "/tasks", icon: Users, id: "groups", label: "Groupes" },
  {
    href: "/tasks/my",
    icon: CalendarDays,
    id: "calendar",
    label: "Calendrier",
  },
  { href: "/tasks/my", icon: UserCheck, id: "mine", label: "Mes taches" },
  { href: "/users", icon: Users, id: "users", label: "Utilisateurs" },
  { href: "/dashboard", icon: ScrollText, id: "reports", label: "Rapports" },
  { href: "/settings", icon: Settings, id: "settings", label: "Parametres" },
];
