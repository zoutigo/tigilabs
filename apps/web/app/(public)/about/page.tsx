import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="public-shell">
      <nav className="public-nav">
        <Link className="brand" href="/">
          Tigilabs
        </Link>
        <div className="nav-links">
          <Link href="/solutions/scolive">Solutions</Link>
          <Link href="/contact">Contact</Link>
        </div>
      </nav>
      <section className="section">
        <h1>A propos de Tigilabs</h1>
        <p>
          Tigilabs est une société camerounaise de solutions numériques. Nous construisons des outils
          métier fiables, maintenables et adaptés aux réalités opérationnelles locales.
        </p>
      </section>
    </main>
  );
}
