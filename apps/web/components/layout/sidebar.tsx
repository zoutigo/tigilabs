"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TigilabsLogo } from "./brand-logo";
import {
  isChildActive,
  isFlatActive,
  isGroupActive,
  privateNavLinks,
} from "./navigation";

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
