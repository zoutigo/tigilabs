"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { changeEmailSchema, type ChangeEmailInput } from "@tigilabs/schemas";
import { Clock3, Mail, Pencil, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { changeEmail } from "../../lib/api/auth";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useToast } from "../ui/toast";

type ChangeEmailCardProps = {
  email: string;
  pendingEmail?: string | null;
};

export function ChangeEmailCard({
  email,
  pendingEmail,
}: Readonly<ChangeEmailCardProps>) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [hasPending, setHasPending] = useState(Boolean(pendingEmail));
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<ChangeEmailInput>({
    mode: "onChange",
    resolver: zodResolver(changeEmailSchema),
  });

  function cancel() {
    reset();
    setIsEditing(false);
  }

  async function onSubmit(values: ChangeEmailInput) {
    try {
      await changeEmail(values);
      setHasPending(true);
      reset();
      setIsEditing(false);
      toast({
        description: `Un email de confirmation a ete envoye a ${values.newEmail}.`,
        title: "Verifiez votre nouvelle boite mail.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title:
          error instanceof Error
            ? error.message
            : "La demande de changement a echoue.",
        variant: "error",
      });
    }
  }

  return (
    <section className="card account-section">
      <div className="panel-heading">
        <h3>
          <Mail size={16} />
          Adresse email
        </h3>
        {!isEditing ? (
          <Button
            onClick={() => setIsEditing(true)}
            type="button"
            variant="secondary"
          >
            <Pencil size={14} />
            Modifier
          </Button>
        ) : null}
      </div>

      <p className="account-current-value">{email}</p>

      {hasPending ? (
        <div className="form-message form-message-info account-pending-banner">
          <Clock3 size={18} />
          <div>
            <strong>Confirmation en attente</strong>
            <p>
              Un email a ete envoye a {pendingEmail ?? "la nouvelle adresse"}.
              Ouvrez-le pour valider le changement.
            </p>
          </div>
        </div>
      ) : null}

      {isEditing ? (
        <form
          className="form inline-form-panel"
          onSubmit={handleSubmit(onSubmit)}
        >
          <Input
            error={errors.newEmail?.message}
            label="Nouvelle adresse email"
            placeholder="nouvelle.adresse@tigilabs.com"
            type="email"
            {...register("newEmail")}
          />
          <Input
            error={errors.currentPassword?.message}
            label="Mot de passe actuel"
            placeholder="Confirmez votre mot de passe"
            type="password"
            {...register("currentPassword")}
          />
          <div className="account-inline-form-actions-row">
            <Button
              disabled={isSubmitting}
              onClick={cancel}
              type="button"
              variant="ghost"
            >
              <X size={14} />
              Annuler
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? "Envoi..." : "Envoyer la confirmation"}
            </Button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
