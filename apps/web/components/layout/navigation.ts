import {
  CheckSquare,
  LayoutDashboard,
  Settings,
  UserCheck,
  Users,
} from "lucide-react";

export const privateNavLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Taches", icon: CheckSquare },
  { href: "/tasks/my", label: "Mes taches", icon: UserCheck },
  { href: "/users", label: "Utilisateurs", icon: Users },
  { href: "/settings", label: "Parametres", icon: Settings },
];
