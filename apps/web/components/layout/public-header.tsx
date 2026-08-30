"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "../ui/button";
import { TigilabsLogo } from "./brand-logo";

const publicNavLinks = [
  { href: "/", label: "Accueil" },
  { href: "/solutions/scolive", label: "Solutions" },
  { href: "/about", label: "A propos" },
  { href: "/contact", label: "Contact" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="public-header">
      <nav aria-label="Navigation principale" className="public-nav">
        <TigilabsLogo href="/" />

        <div className="public-nav-links">
          {publicNavLinks.map((link) => (
            <Link
              aria-current={pathname === link.href ? "page" : undefined}
              className={pathname === link.href ? "is-active" : undefined}
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
          <Link className="public-nav-cta" href="/login">
            Espace interne
          </Link>
        </div>

        <Button
          aria-expanded={open}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          className="public-nav-toggle"
          onClick={() => setOpen((current) => !current)}
          type="button"
          variant="ghost"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </Button>
      </nav>

      {open ? (
        <div className="public-nav-mobile" role="dialog" aria-modal="true">
          {publicNavLinks.map((link) => (
            <Link
              aria-current={pathname === link.href ? "page" : undefined}
              className={pathname === link.href ? "is-active" : undefined}
              href={link.href}
              key={link.href}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            className="public-nav-cta"
            href="/login"
            onClick={() => setOpen(false)}
          >
            Espace interne
          </Link>
        </div>
      ) : null}
    </header>
  );
}
