"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthShell } from "../../../components/layout/auth-shell";
import { Button } from "../../../components/ui/button";
import { confirmEmailChange } from "../../../lib/api/auth";

export default function ConfirmEmailChangePage() {
  return (
    <AuthShell>
      <Suspense fallback={<ConfirmEmailChangeFallback />}>
        <ConfirmEmailChangeContent />
      </Suspense>
    </AuthShell>
  );
}

function ConfirmEmailChangeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("Confirmation en cours...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Lien de confirmation invalide.");
      return;
    }

    confirmEmailChange(token)
      .then((response) => {
        setStatus("success");
        setMessage(response.message);
      })
      .catch((error) => {
        setStatus("error");
        setMessage(
          error instanceof Error ? error.message : "Confirmation impossible.",
        );
      });
  }, [token]);

  return (
    <section className="card auth-shell-card">
      <h1>Nouvelle adresse email</h1>
      <p className={status === "error" ? "form-error" : "form-success"}>
        {message}
      </p>
      <Button asChild>
        <Link href="/account">Retour a mon compte</Link>
      </Button>
    </section>
  );
}

function ConfirmEmailChangeFallback() {
  return (
    <section className="card auth-shell-card">
      <h1>Nouvelle adresse email</h1>
      <p className="muted">Confirmation en cours...</p>
    </section>
  );
}
