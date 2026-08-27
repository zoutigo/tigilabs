import Link from "next/link";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <Link className="brand" href="/">
        Tigilabs
      </Link>
      <section className="card" style={{ marginTop: 32, maxWidth: 440 }}>
        <h1>Connexion</h1>
        <form className="form">
          <Input label="Email" name="email" placeholder="vous@tigilabs.com" type="email" />
          <Input label="Mot de passe" name="password" placeholder="Mot de passe" type="password" />
          <Button type="submit">Se connecter</Button>
        </form>
        <p>
          <Link className="muted" href="/forgot-password">
            Mot de passe oublie ?
          </Link>
        </p>
      </section>
    </main>
  );
}
