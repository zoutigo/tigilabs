"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@tigilabs/schemas";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { PasswordRequirements } from "../../../components/auth/password-requirements";
import { AuthShell } from "../../../components/layout/auth-shell";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { register as registerAccount } from "../../../lib/api/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    watch,
  } = useForm<RegisterInput>({
    mode: "onChange",
    resolver: zodResolver(registerSchema),
  });
  const password = watch("password") ?? "";

  async function onSubmit(values: RegisterInput) {
    setFormError(null);
    try {
      const response = await registerAccount(values);
      reset();
      const params = new URLSearchParams({
        registered: "1",
        activationExpiresInHours: String(response.activationExpiresInHours),
      });

      router.replace(`/login?${params.toString()}`);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Inscription impossible.",
      );
    }
  }

  return (
    <AuthShell>
      <section className="card auth-shell-card">
        <h1>Inscription</h1>
        <p className="muted">
          Creez votre compte pour rejoindre l&apos;espace interne Tigilabs.
        </p>
        <form className="form" onSubmit={handleSubmit(onSubmit)}>
          <div className="two-columns">
            <Input
              error={errors.lastName?.message}
              label="Nom"
              placeholder="Nom"
              {...register("lastName")}
            />
            <Input
              error={errors.firstName?.message}
              label="Prenom"
              placeholder="Prenom"
              {...register("firstName")}
            />
          </div>
          <Input
            error={errors.email?.message}
            label="Email"
            placeholder="vous@tigilabs.com"
            type="email"
            {...register("email")}
          />
          <Input
            error={errors.password?.message}
            label="Mot de passe"
            placeholder="Mot de passe"
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
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Inscription..." : "Creer mon compte"}
          </Button>
        </form>
        <p>
          <Link className="muted" href="/login">
            Deja inscrit ?
          </Link>
        </p>
      </section>
    </AuthShell>
  );
}
