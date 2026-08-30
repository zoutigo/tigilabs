"use client";

import { CalendarDays, UserRound } from "lucide-react";
import { useCurrentUser } from "../../hooks/use-current-user";
import { updateProfile } from "../../lib/api/auth";
import { initialsFor, roleLabelFor } from "../../lib/utils";
import { ChangeEmailCard } from "./change-email-card";
import { ChangePasswordCard } from "./change-password-card";
import { InlineNameField } from "./inline-name-field";

export function AccountOverview() {
  const { isLoading, setUser, user } = useCurrentUser();

  if (isLoading) {
    return (
      <section className="empty-state">
        <p>Chargement de votre profil...</p>
      </section>
    );
  }

  return (
    <div className="account-layout">
      <section className="card account-hero">
        <span
          className="avatar avatar-photo account-hero-avatar"
          aria-hidden="true"
        >
          {initialsFor(user)}
        </span>
        <div>
          <h2>{user.name}</h2>
          <p className="muted">{user.email}</p>
          <span className="badge badge-neutral">{roleLabelFor(user)}</span>
        </div>
      </section>

      <section className="card account-section">
        <h3>
          <UserRound size={16} />
          Identite
        </h3>
        <div className="account-field-grid">
          <InlineNameField
            icon={UserRound}
            label="Prenom"
            onSave={async (value) => {
              const updated = await updateProfile({ firstName: value });
              setUser(updated);
            }}
            value={user.firstName ?? ""}
          />
          <InlineNameField
            icon={UserRound}
            label="Nom"
            onSave={async (value) => {
              const updated = await updateProfile({ lastName: value });
              setUser(updated);
            }}
            value={user.lastName ?? ""}
          />
          <div className="meta-card">
            <div className="meta-head">
              <span className="meta-icon">
                <CalendarDays size={15} />
              </span>
              <span className="meta-label">Statut du compte</span>
            </div>
            <span className="meta-value">
              {user.status === "ACTIVE" ? "Actif" : user.status}
            </span>
          </div>
        </div>
      </section>

      <ChangeEmailCard email={user.email} pendingEmail={user.pendingEmail} />
      <ChangePasswordCard />
    </div>
  );
}
