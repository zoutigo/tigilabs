"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TigilabsLogo } from "./brand-logo";
import { privateNavLinks } from "./navigation";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <TigilabsLogo href="/dashboard" />
      <nav aria-label="Navigation interne">
        {privateNavLinks.map(({ href, id, label, icon: Icon }) => (
          <Link
            aria-current={isActive(pathname, href, id) ? "page" : undefined}
            className={isActive(pathname, href, id) ? "is-active" : undefined}
            href={href}
            key={id}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>
      <div className="sidebar-user">
        <span className="avatar avatar-photo" aria-hidden="true">
          VM
        </span>
        <span>
          <strong>Valery M.</strong>
          <small>Administrateur</small>
        </span>
      </div>
    </aside>
  );
}

function isActive(pathname: string, href: string, id: string) {
  if (id === "reports") {
    return false;
  }

  if (id === "tasks") {
    return (
      pathname === "/tasks" ||
      (pathname.startsWith("/tasks/") && !pathname.startsWith("/tasks/my"))
    );
  }

  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
