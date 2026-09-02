import { Handshake, Lightbulb, ShieldCheck, Target } from "lucide-react";
import Link from "next/link";
import { Button } from "../../../components/ui/button";
import { Reveal } from "../../../components/ui/reveal";

const values = [
  {
    icon: Target,
    title: "Pragmatisme",
    description:
      "Nous construisons des solutions utiles avant d'etre spectaculaires : simples a comprendre, faciles a maintenir.",
  },
  {
    icon: ShieldCheck,
    title: "Fiabilite",
    description:
      "Nos plateformes sont testees, securisees et pensees pour tenir dans la duree, pas seulement pour la demo.",
  },
  {
    icon: Lightbulb,
    title: "Ancrage local",
    description:
      "Nos outils sont concus pour les realites operationnelles des organisations camerounaises et africaines.",
  },
  {
    icon: Handshake,
    title: "Partenariat",
    description:
      "Nous accompagnons nos clients sur la duree, du cadrage initial a l'evolution de la plateforme.",
  },
];

export default function AboutPage() {
  return (
    <main>
      <section className="hero about-hero">
        <Reveal className="hero-copy">
          <span className="eyebrow">A propos</span>
          <h1>
            Une societe <span className="text-gradient">camerounaise</span> de
            solutions numeriques
          </h1>
          <p>
            Tigilabs construit des outils metier fiables, maintenables et
            adaptes aux realites operationnelles locales : plateformes web,
            backends API et produits numeriques comme Scolive.
          </p>
          <div className="button-row">
            <Button asChild>
              <Link href="/contact">Discuter d&apos;un projet</Link>
            </Button>
          </div>
        </Reveal>
      </section>

      <section className="section">
        <Reveal>
          <span className="eyebrow">Nos valeurs</span>
          <h2>Ce qui guide notre facon de travailler</h2>
        </Reveal>
        <div className="grid services-grid">
          {values.map((value, index) => (
            <Reveal
              as="article"
              className="card service-card"
              delay={index * 80}
              key={value.title}
            >
              <span className="service-icon">
                <value.icon size={22} aria-hidden="true" />
              </span>
              <h3>{value.title}</h3>
              <p className="muted">{value.description}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section">
        <Reveal className="card">
          <h2>Notre mission</h2>
          <p className="muted">
            Aider les organisations a structurer leurs operations et exploiter
            leurs donnees grace a des plateformes numeriques concues sur mesure,
            du cadrage strategique jusqu&apos;au support quotidien.
          </p>
        </Reveal>
      </section>
    </main>
  );
}
