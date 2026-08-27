import { CheckSquare, LayoutDashboard, Settings, Users } from "lucide-react";
import Link from "next/link";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Taches", icon: CheckSquare },
  { href: "/users", label: "Utilisateurs", icon: Users },
  { href: "/settings", label: "Parametres", icon: Settings }
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <Link className="brand" href="/dashboard">
        Tigilabs
      </Link>
      <nav aria-label="Navigation interne">
        {links.map(({ href, label, icon: Icon }) => (
          <Link href={href} key={href}>
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
