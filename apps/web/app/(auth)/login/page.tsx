"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@tigilabs/schemas";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { login } from "../../../lib/api/auth";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register: registerField,
  } = useForm<LoginInput>({
    mode: "onChange",
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(values: LoginInput) {
    setFormError(null);
    try {
      await login(values);
      router.push(searchParams.get("next") ?? "/dashboard");
      router.refresh();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Connexion impossible.",
      );
    }
  }

  return (
    <main className="auth-page">
      <Link className="brand" href="/">
        Tigilabs
      </Link>
      <section className="card" style={{ marginTop: 32, maxWidth: 440 }}>
        <h1>Connexion</h1>
        <form className="form" onSubmit={handleSubmit(onSubmit)}>
          <Input
            error={errors.email?.message}
            label="Email"
            placeholder="vous@tigilabs.com"
            type="email"
            {...registerField("email")}
          />
          <Input
            error={errors.password?.message}
            label="Mot de passe"
            placeholder="Mot de passe"
            type="password"
            {...registerField("password")}
          />
          {formError ? <p className="form-error">{formError}</p> : null}
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Connexion..." : "Se connecter"}
          </Button>
        </form>
        <p>
          <Link className="muted" href="/forgot-password">
            Mot de passe oublie ?
          </Link>
        </p>
        <p>
          <Link className="muted" href="/register">
            Creer un compte
          </Link>
        </p>
      </section>
    </main>
  );
}
