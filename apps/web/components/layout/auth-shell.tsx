import type { ReactNode } from "react";
import { TigilabsLogo } from "./brand-logo";

const pitchPoints = [
  "Suivi des taches et des groupes en temps reel",
  "Gestion des roles et des permissions",
  "Historique et audit complet des activites",
];

export function AuthShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="auth-shell">
      <aside className="auth-shell-brand">
        <TigilabsLogo href="/" />
        <div className="auth-shell-pitch">
          <span className="auth-shell-eyebrow">Espace interne</span>
          <h2>Pilotez vos equipes et vos operations depuis un seul endroit.</h2>
          <ul className="auth-shell-points">
            {pitchPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
        <svg
          aria-hidden="true"
          className="auth-shell-network"
          focusable="false"
          viewBox="0 0 320 220"
        >
          <g className="auth-shell-network-lines">
            <line x1="26" x2="120" y1="150" y2="70" />
            <line x1="120" x2="220" y1="70" y2="118" />
            <line x1="220" x2="290" y1="118" y2="52" />
            <line x1="120" x2="70" y1="70" y2="20" />
            <line x1="220" x2="270" y1="118" y2="176" />
          </g>
          <g className="auth-shell-network-nodes">
            <circle cx="26" cy="150" r="5" />
            <circle cx="120" cy="70" r="6" />
            <circle cx="220" cy="118" r="6" />
            <circle cx="290" cy="52" r="4" />
            <circle cx="70" cy="20" r="4" />
            <circle cx="270" cy="176" r="5" />
          </g>
        </svg>
      </aside>
      <main className="auth-shell-panel">
        <div className="auth-shell-panel-inner">{children}</div>
      </main>
    </div>
  );
}
