"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthShell } from "../../../components/layout/auth-shell";
import { Button } from "../../../components/ui/button";
import { confirmEmail } from "../../../lib/api/auth";

export default function ConfirmEmailPage() {
  return (
    <AuthShell>
      <Suspense fallback={<ConfirmEmailFallback />}>
        <ConfirmEmailContent />
      </Suspense>
    </AuthShell>
  );
}

function ConfirmEmailContent() {
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

    confirmEmail(token)
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
      <h1>Confirmation email</h1>
      <p className={status === "error" ? "form-error" : "form-success"}>
        {message}
      </p>
      <Button asChild>
        <Link href="/login">Aller a la connexion</Link>
      </Button>
    </section>
  );
}

function ConfirmEmailFallback() {
  return (
    <section className="card auth-shell-card">
      <h1>Confirmation email</h1>
      <p className="muted">Confirmation en cours...</p>
    </section>
  );
}
