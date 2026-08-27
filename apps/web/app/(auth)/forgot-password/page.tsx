"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@tigilabs/schemas";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { forgotPassword } from "../../../lib/api/auth";

export default function ForgotPasswordPage() {
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<ForgotPasswordInput>({
    mode: "onChange",
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setFormError(null);
    setSuccess(null);
    try {
      const response = await forgotPassword(values);
      setSuccess(response.message);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Envoi impossible.",
      );
    }
  }

  return (
    <main className="auth-page">
      <Link className="brand" href="/">
        Tigilabs
      </Link>
      <section className="card" style={{ marginTop: 32, maxWidth: 440 }}>
        <h1>Reinitialisation</h1>
        <p className="muted">
          Recevez un lien de réinitialisation sur votre adresse professionnelle.
        </p>
        <form className="form" onSubmit={handleSubmit(onSubmit)}>
          <Input
            error={errors.email?.message}
            label="Email"
            placeholder="vous@tigilabs.com"
            type="email"
            {...register("email")}
          />
          {formError ? <p className="form-error">{formError}</p> : null}
          {success ? <p className="form-success">{success}</p> : null}
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Envoi..." : "Envoyer le lien"}
          </Button>
        </form>
      </section>
    </main>
  );
}
