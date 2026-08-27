import Link from "next/link";
import { Button } from "../../../../components/ui/button";

export default function ScolivePage() {
  return (
    <main className="public-shell">
      <nav className="public-nav">
        <Link className="brand" href="/">
          Tigilabs
        </Link>
        <div className="nav-links">
          <Link href="/about">A propos</Link>
          <Link href="/contact">Contact</Link>
        </div>
      </nav>
      <section className="section">
        <h1>Scolive</h1>
        <p>
          Scolive est une solution de gestion scolaire développée par Tigilabs.
          Elle accompagne les établissements dans le suivi administratif,
          pédagogique et opérationnel.
        </p>
        <div className="grid">
          <article className="card">
            <h3>Gestion scolaire</h3>
            <p className="muted">
              Centralisation des données élèves, classes, équipes et familles.
            </p>
          </article>
          <article className="card">
            <h3>Suivi quotidien</h3>
            <p className="muted">
              Présences, discipline, communications et indicateurs.
            </p>
          </article>
          <article className="card">
            <h3>Produit séparé</h3>
            <p className="muted">
              Scolive conserve son propre site, sa roadmap et son identité.
            </p>
          </article>
        </div>
        <div className="button-row">
          <Button asChild>
            <Link href="/contact">Demander une présentation</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
