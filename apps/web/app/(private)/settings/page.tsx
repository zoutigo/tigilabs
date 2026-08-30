import { RequirePermission } from "../../../components/auth/require-permission";
import { SiteSettingsForm } from "../../../components/settings/site-settings-form";

export default function SettingsPage() {
  return (
    <RequirePermission permission="settings.manage">
      <section className="card">
        <h2>Parametres du site</h2>
        <p className="muted">
          Ces informations alimentent le site public (pied de page, page
          contact, politique de confidentialite).
        </p>
        <SiteSettingsForm />
      </section>
    </RequirePermission>
  );
}
