import { ShieldCheck } from "lucide-react";
import { getPublicSiteSettings } from "../../../lib/api/settings";

const FALLBACK_POLICY =
  "Tigilabs collecte uniquement les informations necessaires au traitement de vos demandes de contact (nom, email, message). Ces donnees ne sont jamais cedees a des tiers et sont conservees le temps necessaire au traitement de votre demande. Vous pouvez demander leur suppression a tout moment en nous contactant.";

export default async function PrivacyPage() {
  const settings = await getPublicSiteSettings().catch(() => null);
  const policy = settings?.privacyPolicy ?? FALLBACK_POLICY;

  return (
    <main>
      <section className="section privacy-section">
        <span className="eyebrow">
          <ShieldCheck size={14} aria-hidden="true" /> Confidentialite
        </span>
        <h1>Politique de confidentialite</h1>
        {policy.split(/\n{2,}/).map((paragraph, index) => (
          <p className="muted" key={index}>
            {paragraph}
          </p>
        ))}
      </section>
    </main>
  );
}
