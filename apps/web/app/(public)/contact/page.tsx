import { Clock, Mail, Phone, User } from "lucide-react";
import type { SiteSettings } from "@tigilabs/types";
import { ContactForm } from "../../../components/contact/contact-form";
import { Reveal } from "../../../components/ui/reveal";
import { getPublicSiteSettings } from "../../../lib/api/settings";

const FALLBACK_SETTINGS: SiteSettings = {
  companyName: "Tigilabs",
  ownerName: "Direction Tigilabs",
  contactEmail: "contact@tigilabs.com",
  contactPhone: "+237 600 000 000",
  privacyPolicy: "",
};

export default async function ContactPage() {
  const settings = await getPublicSiteSettings().catch(() => FALLBACK_SETTINGS);

  return (
    <main>
      <section className="section contact-section">
        <Reveal className="contact-info">
          <span className="eyebrow">Contact</span>
          <h1>
            Parlons de votre <span className="text-gradient">projet</span>
          </h1>
          <p className="muted">
            Presentez votre besoin et l&apos;equipe Tigilabs revient vers vous
            rapidement.
          </p>

          <div className="contact-info-card">
            <span className="contact-info-item">
              <User size={17} aria-hidden="true" />
              <span>
                <strong>Responsable</strong>
                <span>{settings.ownerName}</span>
              </span>
            </span>
            <span className="contact-info-item">
              <Mail size={17} aria-hidden="true" />
              <span>
                <strong>Email</strong>
                <a href={`mailto:${settings.contactEmail}`}>
                  {settings.contactEmail}
                </a>
              </span>
            </span>
            <span className="contact-info-item">
              <Phone size={17} aria-hidden="true" />
              <span>
                <strong>Telephone</strong>
                <a href={`tel:${settings.contactPhone.replace(/\s+/g, "")}`}>
                  {settings.contactPhone}
                </a>
              </span>
            </span>
            <span className="contact-info-item">
              <Clock size={17} aria-hidden="true" />
              <span>
                <strong>Reponse</strong>
                <span>Sous 1 a 2 jours ouvres</span>
              </span>
            </span>
          </div>
        </Reveal>

        <Reveal className="card contact-form-card" delay={100}>
          <ContactForm />
        </Reveal>
      </section>
    </main>
  );
}
