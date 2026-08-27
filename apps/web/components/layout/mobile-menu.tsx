"use client";

import { LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { logout } from "../../lib/api/auth";
import { Button } from "../ui/button";
import { TigilabsLogo } from "./brand-logo";
import { privateNavLinks } from "./navigation";

export function MobileMenu() {
  const router = useRouter();
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
              {privateNavLinks.map(({ href, id, label, icon: Icon }) => (
                <Link href={href} key={id} onClick={() => setOpen(false)}>
                  <Icon size={19} />
                  <span>{label}</span>
                </Link>
              ))}
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
