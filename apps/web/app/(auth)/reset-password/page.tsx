"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@tigilabs/schemas";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { PasswordRequirements } from "../../../components/auth/password-requirements";
import { AuthShell } from "../../../components/layout/auth-shell";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { resetPassword } from "../../../lib/api/auth";

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <Suspense fallback={<ResetPasswordFallback />}>
        <ResetPasswordContent />
      </Suspense>
    </AuthShell>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [formError, setFormError] = useState<string | null>(
    token ? null : "Lien de reinitialisation invalide.",
  );
  const [success, setSuccess] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    watch,
  } = useForm<ResetPasswordInput>({
    mode: "onChange",
    resolver: zodResolver(resetPasswordSchema),
  });
  const password = watch("password") ?? "";

  async function onSubmit(values: ResetPasswordInput) {
    if (!token) {
      setFormError("Lien de reinitialisation invalide.");
      return;
    }

    setFormError(null);
    setSuccess(null);
    try {
      const response = await resetPassword({ token, ...values });
      setSuccess(response.message);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Reinitialisation impossible.",
      );
    }
  }

  return (
    <section className="card auth-shell-card">
      <h1>Nouveau mot de passe</h1>
      <form className="form" onSubmit={handleSubmit(onSubmit)}>
        <Input
          error={errors.password?.message}
          label="Mot de passe"
          placeholder="Nouveau mot de passe"
          type="password"
          {...register("password")}
        />
        <PasswordRequirements value={password} />
        <Input
          error={errors.passwordConfirm?.message}
          label="Confirmation"
          placeholder="Confirmez le mot de passe"
          type="password"
          {...register("passwordConfirm")}
        />
        {formError ? <p className="form-error">{formError}</p> : null}
        {success ? <p className="form-success">{success}</p> : null}
        <Button disabled={isSubmitting || !token} type="submit">
          {isSubmitting ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </form>
      <p>
        <Link className="muted" href="/login">
          Retour a la connexion
        </Link>
      </p>
    </section>
  );
}

function ResetPasswordFallback() {
  return (
    <section className="card auth-shell-card">
      <h1>Nouveau mot de passe</h1>
    </section>
  );
}
