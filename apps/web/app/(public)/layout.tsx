import type { SiteSettings } from "@tigilabs/types";
import { PublicFooter } from "../../components/layout/public-footer";
import { PublicHeader } from "../../components/layout/public-header";
import { getPublicSiteSettings } from "../../lib/api/settings";

/**
 * Site settings (company name, contact details, privacy policy) are editable
 * from the private admin area, so public pages must not be frozen at build
 * time - refetch periodically instead of caching forever.
 */
export const revalidate = 300;

const FALLBACK_SETTINGS: SiteSettings = {
  companyName: "Tigilabs",
  ownerName: "Direction Tigilabs",
  contactEmail: "contact@tigilabs.com",
  contactPhone: "+237 600 000 000",
  privacyPolicy:
    "Tigilabs collecte uniquement les informations necessaires au traitement de vos demandes de contact.",
};

export default async function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const settings = await getPublicSiteSettings().catch(() => FALLBACK_SETTINGS);

  return (
    <div className="public-shell">
      <PublicHeader />
      {children}
      <PublicFooter settings={settings} />
    </div>
  );
}
