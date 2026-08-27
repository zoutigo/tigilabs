import Link from "next/link";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";

export default function ContactPage() {
  return (
    <main className="public-shell">
      <nav className="public-nav">
        <Link className="brand" href="/">
          Tigilabs
        </Link>
        <div className="nav-links">
          <Link href="/solutions/scolive">Solutions</Link>
          <Link href="/about">A propos</Link>
        </div>
      </nav>
      <section className="section">
        <h1>Contact</h1>
        <p>Présentez votre besoin et l'équipe Tigilabs reviendra vers vous.</p>
        <form className="card form">
          <Input label="Nom" name="name" placeholder="Votre nom" />
          <Input label="Email" name="email" placeholder="vous@entreprise.com" type="email" />
          <label className="form">
            <span>Message</span>
            <textarea name="message" rows={5} placeholder="Votre besoin" />
          </label>
          <Button type="submit">Envoyer</Button>
        </form>
      </section>
    </main>
  );
}
