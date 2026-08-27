"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/button";
import { confirmEmail } from "../../../lib/api/auth";

export default function ConfirmEmailPage() {
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
    <main className="auth-page">
      <Link className="brand" href="/">
        Tigilabs
      </Link>
      <section className="card" style={{ marginTop: 32, maxWidth: 440 }}>
        <h1>Confirmation email</h1>
        <p className={status === "error" ? "form-error" : "form-success"}>
          {message}
        </p>
        <Button asChild>
          <Link href="/login">Aller a la connexion</Link>
        </Button>
      </section>
    </main>
  );
}
