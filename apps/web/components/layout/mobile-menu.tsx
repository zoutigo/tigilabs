"use client";

import { LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { logout } from "../../lib/api/auth";
import { Button } from "../ui/button";
import { TigilabsLogo } from "./brand-logo";
import {
  isChildActive,
  isFlatActive,
  isGroupActive,
  privateNavLinks,
} from "./navigation";

export function MobileMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await logout();
    setOpen(false);
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="mobile-menu">
      <Button
        aria-label="Ouvrir le menu"
        onClick={() => setOpen(true)}
        type="button"
        variant="ghost"
      >
        <Menu size={22} />
      </Button>

      {open ? (
        <div className="mobile-menu-overlay">
          <section
            aria-label="Menu de navigation"
            aria-modal="true"
            className="mobile-menu-dialog"
            role="dialog"
          >
            <div className="mobile-menu-header">
              <TigilabsLogo compact />
              <Button
                aria-label="Fermer le menu"
                onClick={() => setOpen(false)}
                type="button"
                variant="ghost"
              >
                <X size={19} />
              </Button>
            </div>

            <nav aria-label="Navigation mobile" className="mobile-menu-nav">
              {privateNavLinks.map((item) =>
                item.children ? (
                  <div className="mobile-menu-nav-group" key={item.id}>
                    <span
                      className={
                        isGroupActive(pathname, item)
                          ? "mobile-menu-nav-parent is-active"
                          : "mobile-menu-nav-parent"
                      }
                    >
                      <item.icon size={17} />
                      {item.label}
                    </span>
                    <div className="mobile-menu-nav-children">
                      {item.children.map((child) => {
                        const active = isChildActive(pathname, child);

                        return (
                          <Link
                            aria-current={active ? "page" : undefined}
                            className={active ? "is-active" : undefined}
                            href={child.href}
                            key={child.id}
                            onClick={() => setOpen(false)}
                          >
                            <child.icon size={17} />
                            <span>{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <Link
                    aria-current={
                      isFlatActive(pathname, item.href, item.id)
                        ? "page"
                        : undefined
                    }
                    className={
                      isFlatActive(pathname, item.href, item.id)
                        ? "is-active"
                        : undefined
                    }
                    href={item.href}
                    key={item.id}
                    onClick={() => setOpen(false)}
                  >
                    <item.icon size={19} />
                    <span>{item.label}</span>
                  </Link>
                ),
              )}
            </nav>

            <button
              className="mobile-menu-logout"
              onClick={handleLogout}
              type="button"
            >
              <LogOut size={19} />
              <span>Deconnexion</span>
            </button>
          </section>
        </div>
      ) : null}
    </div>
  );
}
