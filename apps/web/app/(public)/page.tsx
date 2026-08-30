import {
  ArrowRight,
  Compass,
  Database,
  GraduationCap,
  Layers,
  LineChart,
  Rocket,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import { Reveal } from "../../components/ui/reveal";

const stats = [
  { label: "Solutions metier livrees", value: "10+" },
  { label: "Disponibilite plateforme", value: "99.9%" },
  { label: "Support reactif", value: "7j/7" },
];

const services = [
  {
    icon: Compass,
    title: "Conseil et cadrage",
    description:
      "Architecture, priorisation produit et trajectoire technique pour transformer une idee en feuille de route executable.",
  },
  {
    icon: Layers,
    title: "Plateformes web",
    description:
      "Applications web modernes, backends API robustes et integrations metier, pensees pour durer et evoluer.",
  },
  {
    icon: GraduationCap,
    title: "Produits numeriques",
    description:
      "Solutions evolutives pour l'education, la gestion et les services, comme Scolive, notre plateforme de gestion scolaire.",
  },
  {
    icon: Database,
    title: "Donnees et operations",
    description:
      "Structuration des donnees, tableaux de bord et automatisations pour piloter l'activite au quotidien.",
  },
];

const steps = [
  {
    icon: Compass,
    title: "Cadrage",
    description: "Comprendre vos enjeux, vos utilisateurs et vos contraintes.",
  },
  {
    icon: Sparkles,
    title: "Conception",
    description: "Prototyper une solution claire, alignee avec vos objectifs.",
  },
  {
    icon: Rocket,
    title: "Developpement",
    description: "Livrer par iterations courtes, testees et deployables.",
  },
  {
    icon: LineChart,
    title: "Accompagnement",
    description: "Suivre l'usage, ajuster et faire evoluer la plateforme.",
  },
];

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <Reveal className="hero-copy">
          <span className="eyebrow">Solutions numeriques</span>
          <h1>
            Des plateformes numeriques robustes pour organisations exigeantes
          </h1>
          <p>
            Tigilabs concoit et developpe des outils qui structurent vos
            operations, exploitent vos donnees et livrent des services fiables a
            vos equipes comme a vos usagers.
          </p>
          <div className="button-row">
            <Button asChild>
              <Link href="/contact">
                Parler du projet <ArrowRight size={16} />
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/solutions/scolive">Decouvrir Scolive</Link>
            </Button>
          </div>
        </Reveal>

        <Reveal className="hero-visual" delay={120}>
          <div className="hero-visual-card">
            <ShieldCheck size={22} aria-hidden="true" />
            <div>
              <strong>Produits SaaS</strong>
              <span className="badge badge-success">Actif</span>
            </div>
          </div>
          <div className="hero-visual-card">
            <Layers size={22} aria-hidden="true" />
            <div>
              <strong>Solutions metier</strong>
              <span className="badge badge-warning">En cadrage</span>
            </div>
          </div>
          <div className="hero-visual-card">
            <LineChart size={22} aria-hidden="true" />
            <div>
              <strong>Operations internes</strong>
              <span className="badge badge-neutral">Suivi</span>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="stat-row-section">
        <div className="stat-row">
          {stats.map((stat) => (
            <Reveal className="stat-item" key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section">
        <Reveal>
          <span className="eyebrow">Ce que nous faisons</span>
          <h2>Un accompagnement de bout en bout</h2>
        </Reveal>
        <div className="grid services-grid">
          {services.map((service, index) => (
            <Reveal
              as="article"
              className="card service-card"
              delay={index * 80}
              key={service.title}
            >
              <span className="service-icon">
                <service.icon size={22} aria-hidden="true" />
              </span>
              <h3>{service.title}</h3>
              <p className="muted">{service.description}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section timeline-section">
        <Reveal>
          <span className="eyebrow">Notre methode</span>
          <h2>Une trajectoire claire, du cadrage au support</h2>
        </Reveal>
        <div className="timeline">
          {steps.map((step, index) => (
            <Reveal
              className="timeline-step"
              delay={index * 100}
              key={step.title}
            >
              <span className="timeline-index">{index + 1}</span>
              <step.icon size={20} aria-hidden="true" />
              <h3>{step.title}</h3>
              <p className="muted">{step.description}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section solutions-showcase">
        <Reveal className="card solution-spotlight">
          <div>
            <span className="eyebrow">Notre solution phare</span>
            <h2>Scolive, la gestion scolaire nouvelle generation</h2>
            <p className="muted">
              Inscriptions, notes, finances, emploi du temps, messagerie et
              application mobile : Scolive couvre l&apos;ensemble du quotidien
              d&apos;un etablissement scolaire multi-sites.
            </p>
            <Button asChild variant="secondary">
              <Link href="/solutions/scolive">
                Explorer Scolive <ArrowRight size={16} />
              </Link>
            </Button>
          </div>
          <div className="solution-spotlight-visual" aria-hidden="true">
            <GraduationCap size={64} />
          </div>
        </Reveal>
      </section>

      <section className="section cta-section">
        <Reveal className="card cta-card">
          <h2>Un projet en tete ?</h2>
          <p className="muted">
            Racontez-nous votre besoin, nous revenons vers vous rapidement pour
            en discuter.
          </p>
          <Button asChild>
            <Link href="/contact">
              Contacter Tigilabs <ArrowRight size={16} />
            </Link>
          </Button>
        </Reveal>
      </section>
    </main>
  );
}
