"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TigilabsLogo } from "./brand-logo";
import { privateNavLinks, type NavEntry, type NavLink } from "./navigation";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <TigilabsLogo href="/dashboard" />
      <nav aria-label="Navigation interne">
        {privateNavLinks.map((item) =>
          item.children ? (
            <div className="sidebar-nav-group" key={item.id}>
              <span
                className={`sidebar-nav-parent ${
                  isGroupActive(pathname, item) ? "is-active" : ""
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </span>
              <div className="sidebar-nav-children">
                {item.children.map((child) => (
                  <Link
                    aria-current={
                      isChildActive(pathname, child) ? "page" : undefined
                    }
                    className={
                      isChildActive(pathname, child) ? "is-active" : undefined
                    }
                    href={child.href}
                    key={child.id}
                  >
                    <child.icon size={17} />
                    {child.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <Link
              aria-current={
                isFlatActive(pathname, item.href, item.id) ? "page" : undefined
              }
              className={
                isFlatActive(pathname, item.href, item.id)
                  ? "is-active"
                  : undefined
              }
              href={item.href}
              key={item.id}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ),
        )}
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

function isGroupActive(pathname: string, item: NavEntry) {
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function isChildActive(pathname: string, child: NavLink) {
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

function isFlatActive(pathname: string, href: string, id: string) {
  if (id === "reports") {
    return false;
  }

  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
