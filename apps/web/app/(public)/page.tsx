import Link from "next/link";
import { Button } from "../../components/ui/button";

export default function HomePage() {
  return (
    <main className="public-shell">
      <nav className="public-nav">
        <Link className="brand" href="/">
          Tigilabs
        </Link>
        <div className="nav-links">
          <Link href="/solutions/scolive">Solutions</Link>
          <Link href="/about">A propos</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/login">Espace interne</Link>
        </div>
      </nav>

      <section className="hero">
        <div>
          <h1>Tigilabs</h1>
          <p>
            Nous concevons des plateformes numériques robustes pour les
            organisations qui veulent structurer leurs opérations, exploiter
            leurs données et livrer des services fiables.
          </p>
          <div className="button-row">
            <Button asChild>
              <Link href="/contact">Parler du projet</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/solutions/scolive">Voir Scolive</Link>
            </Button>
          </div>
        </div>
        <div
          className="hero-visual"
          aria-label="Synthese des activites Tigilabs"
        >
          <div className="signal-row">
            <strong>Produits SaaS</strong>
            <span className="badge badge-success">Actif</span>
          </div>
          <div className="signal-row">
            <strong>Solutions metier</strong>
            <span className="badge badge-warning">En cadrage</span>
          </div>
          <div className="signal-row">
            <strong>Operations internes</strong>
            <span className="badge badge-neutral">Suivi</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="grid">
          <article className="card">
            <h3>Conseil et cadrage</h3>
            <p className="muted">
              Architecture, priorisation produit et trajectoire technique.
            </p>
          </article>
          <article className="card">
            <h3>Plateformes web</h3>
            <p className="muted">
              Applications web modernes, backends API et intégrations métier.
            </p>
          </article>
          <article className="card">
            <h3>Produits numériques</h3>
            <p className="muted">
              Solutions évolutives pour l'éducation, la gestion et les services.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
