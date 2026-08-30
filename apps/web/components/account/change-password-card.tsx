"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@tigilabs/schemas";
import { KeyRound, Pencil, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { PasswordRequirements } from "../auth/password-requirements";
import { changePassword } from "../../lib/api/auth";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useToast } from "../ui/toast";

export function ChangePasswordCard() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    watch,
  } = useForm<ChangePasswordInput>({
    mode: "onChange",
    resolver: zodResolver(changePasswordSchema),
  });
  const newPassword = watch("newPassword") ?? "";

  function cancel() {
    reset();
    setIsEditing(false);
  }

  async function onSubmit(values: ChangePasswordInput) {
    try {
      await changePassword(values);
      reset();
      setIsEditing(false);
      toast({ title: "Mot de passe mis a jour.", variant: "success" });
    } catch (error) {
      toast({
        title:
          error instanceof Error
            ? error.message
            : "La mise a jour du mot de passe a echoue.",
        variant: "error",
      });
    }
  }

  return (
    <section className="card account-section">
      <div className="panel-heading">
        <h3>
          <KeyRound size={16} />
          Mot de passe
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

      {!isEditing ? (
        <p className="account-current-value">••••••••</p>
      ) : (
        <form
          className="form inline-form-panel"
          onSubmit={handleSubmit(onSubmit)}
        >
          <Input
            error={errors.currentPassword?.message}
            label="Mot de passe actuel"
            placeholder="Votre mot de passe actuel"
            type="password"
            {...register("currentPassword")}
          />
          <Input
            error={errors.newPassword?.message}
            label="Nouveau mot de passe"
            placeholder="Nouveau mot de passe"
            type="password"
            {...register("newPassword")}
          />
          <PasswordRequirements value={newPassword} />
          <Input
            error={errors.newPasswordConfirm?.message}
            label="Confirmer le nouveau mot de passe"
            placeholder="Confirmez le nouveau mot de passe"
            type="password"
            {...register("newPasswordConfirm")}
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
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
