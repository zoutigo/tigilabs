import Link from "next/link";
import { privateNavLinks } from "./navigation";

export function Sidebar() {
  return (
    <aside className="sidebar">
      <Link className="brand" href="/dashboard">
        Tigilabs
      </Link>
      <nav aria-label="Navigation interne">
        {privateNavLinks.map(({ href, label, icon: Icon }) => (
          <Link href={href} key={href}>
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
