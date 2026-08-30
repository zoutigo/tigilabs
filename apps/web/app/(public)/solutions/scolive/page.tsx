import {
  ArrowRight,
  Banknote,
  CalendarClock,
  ClipboardList,
  ExternalLink,
  GraduationCap,
  MessagesSquare,
  Smartphone,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Button } from "../../../../components/ui/button";
import { Reveal } from "../../../../components/ui/reveal";

const categories = [
  {
    icon: GraduationCap,
    title: "Pedagogie",
    items: [
      "Inscriptions et suivi des eleves",
      "Notes, evaluations et bulletins",
      "Emploi du temps et devoirs",
    ],
  },
  {
    icon: Banknote,
    title: "Finance et administratif",
    items: [
      "Echeanciers de paiement",
      "Suivi des paiements et relances",
      "Gestion multi-etablissements",
    ],
  },
  {
    icon: MessagesSquare,
    title: "Communication",
    items: [
      "Messagerie interne ecole-famille",
      "Fil d'actualite de l'etablissement",
      "Suivi de la discipline",
    ],
  },
  {
    icon: Smartphone,
    title: "Mobile et multi-ecoles",
    items: [
      "Application mobile Android pour les familles",
      "Architecture multi-etablissements par etablissement",
      "Portail dedie a chaque ecole",
    ],
  },
];

export default function ScolivePage() {
  return (
    <main>
      <section className="hero solution-hero">
        <Reveal className="hero-copy">
          <span className="eyebrow eyebrow-product">
            <GraduationCap size={14} aria-hidden="true" /> Produit independant
          </span>
          <h1>Scolive, la plateforme de gestion scolaire de Tigilabs</h1>
          <p>
            Scolive accompagne les etablissements scolaires dans le suivi
            administratif, pedagogique et operationnel au quotidien, du primaire
            au secondaire, sur un seul et meme outil.
          </p>
          <div className="button-row">
            <Button asChild>
              <Link href="/contact">
                Demander une presentation <ArrowRight size={16} />
              </Link>
            </Button>
          </div>
        </Reveal>
        <Reveal className="hero-visual" delay={120}>
          <div className="hero-visual-card">
            <Users size={22} aria-hidden="true" />
            <div>
              <strong>Familles connectees</strong>
              <span className="badge badge-success">Portail dedie</span>
            </div>
          </div>
          <div className="hero-visual-card">
            <ClipboardList size={22} aria-hidden="true" />
            <div>
              <strong>Suivi pedagogique</strong>
              <span className="badge badge-neutral">Notes & devoirs</span>
            </div>
          </div>
          <div className="hero-visual-card">
            <CalendarClock size={22} aria-hidden="true" />
            <div>
              <strong>Emploi du temps</strong>
              <span className="badge badge-warning">Multi-classes</span>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="section">
        <Reveal>
          <span className="eyebrow">Modules</span>
          <h2>Une couverture complete du fonctionnement d&apos;une ecole</h2>
        </Reveal>
        <div className="grid solutions-grid">
          {categories.map((category, index) => (
            <Reveal
              as="article"
              className="card"
              delay={index * 80}
              key={category.title}
            >
              <span className="service-icon">
                <category.icon size={22} aria-hidden="true" />
              </span>
              <h3>{category.title}</h3>
              <ul className="check-list">
                {category.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section">
        <Reveal className="card product-notice">
          <ExternalLink size={20} aria-hidden="true" />
          <p>
            Scolive est un produit developpe par Tigilabs mais conserve son
            propre site, sa propre roadmap et sa propre identite de marque.
            Cette page presente Scolive uniquement comme l&apos;une des
            solutions de Tigilabs.
          </p>
        </Reveal>
      </section>

      <section className="section cta-section">
        <Reveal className="card cta-card">
          <h2>Envie d&apos;equiper votre etablissement ?</h2>
          <p className="muted">
            Parlons de vos besoins et organisons une demonstration de Scolive.
          </p>
          <Button asChild>
            <Link href="/contact">
              Nous contacter <ArrowRight size={16} />
            </Link>
          </Button>
        </Reveal>
      </section>
    </main>
  );
}
