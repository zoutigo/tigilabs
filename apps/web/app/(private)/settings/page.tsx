import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";

export default function SettingsPage() {
  return (
    <section className="card">
      <h2>Parametres</h2>
      <form className="form">
        <Input label="Nom de l'organisation" defaultValue="Tigilabs" />
        <Input
          label="Email de contact"
          defaultValue="contact@tigilabs.com"
          type="email"
        />
        <Button type="submit">Enregistrer</Button>
      </form>
    </section>
  );
}
