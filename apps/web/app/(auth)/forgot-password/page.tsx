import Link from "next/link";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";

export default function ForgotPasswordPage() {
  return (
    <main className="auth-page">
      <Link className="brand" href="/">
        Tigilabs
      </Link>
      <section className="card" style={{ marginTop: 32, maxWidth: 440 }}>
        <h1>Reinitialisation</h1>
        <p className="muted">Recevez un lien de réinitialisation sur votre adresse professionnelle.</p>
        <form className="form">
          <Input label="Email" name="email" placeholder="vous@tigilabs.com" type="email" />
          <Button type="submit">Envoyer le lien</Button>
        </form>
      </section>
    </main>
  );
}
