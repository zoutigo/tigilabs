"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@tigilabs/schemas";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { register as registerAccount } from "../../../lib/api/auth";

export default function RegisterPage() {
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<RegisterInput>({
    mode: "onChange",
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(values: RegisterInput) {
    setFormError(null);
    setSuccess(null);
    try {
      const response = await registerAccount(values);
      setSuccess(response.message);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Inscription impossible.",
      );
    }
  }

  return (
    <main className="auth-page">
      <Link className="brand" href="/">
        Tigilabs
      </Link>
      <section className="card" style={{ marginTop: 32, maxWidth: 520 }}>
        <h1>Inscription</h1>
        <form className="form" onSubmit={handleSubmit(onSubmit)}>
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
          <Input
            error={errors.passwordConfirm?.message}
            label="Confirmation"
            placeholder="Confirmez le mot de passe"
            type="password"
            {...register("passwordConfirm")}
          />
          {formError ? <p className="form-error">{formError}</p> : null}
          {success ? <p className="form-success">{success}</p> : null}
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
    </main>
  );
}
