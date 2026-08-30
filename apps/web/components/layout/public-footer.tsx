import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import type { SiteSettings } from "@tigilabs/types";
import { TigilabsLogo } from "./brand-logo";

export function PublicFooter({
  settings,
}: Readonly<{ settings: SiteSettings }>) {
  const year = new Date().getFullYear();

  return (
    <footer className="public-footer">
      <div className="public-footer-grid">
        <div className="public-footer-brand">
          <TigilabsLogo href="/" />
          <p className="muted">
            Nous concevons des plateformes numeriques robustes pour les
            organisations qui veulent structurer leurs operations, exploiter
            leurs donnees et livrer des services fiables.
          </p>
        </div>

        <div className="public-footer-col">
          <h4>Navigation</h4>
          <Link href="/">Accueil</Link>
          <Link href="/solutions/scolive">Solutions</Link>
          <Link href="/about">A propos</Link>
          <Link href="/contact">Contact</Link>
        </div>

        <div className="public-footer-col">
          <h4>Contact</h4>
          <span className="public-footer-contact-item">
            <Mail size={15} aria-hidden="true" />
            <a href={`mailto:${settings.contactEmail}`}>
              {settings.contactEmail}
            </a>
          </span>
          <span className="public-footer-contact-item">
            <Phone size={15} aria-hidden="true" />
            <a href={`tel:${settings.contactPhone.replace(/\s+/g, "")}`}>
              {settings.contactPhone}
            </a>
          </span>
          {settings.address ? (
            <span className="public-footer-contact-item">
              <MapPin size={15} aria-hidden="true" />
              {settings.address}
            </span>
          ) : null}
        </div>

        <div className="public-footer-col">
          <h4>Legal</h4>
          <Link href="/privacy">Politique de confidentialite</Link>
        </div>
      </div>

      <div className="public-footer-bottom">
        <span>
          © {year} {settings.companyName}. Tous droits reserves.
        </span>
        <span className="muted">{settings.ownerName}</span>
      </div>
    </footer>
  );
}
