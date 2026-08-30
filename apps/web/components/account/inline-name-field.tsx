"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { requiredNameSchema } from "@tigilabs/schemas";
import { Check, Pencil, X, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "../ui/toast";

const fieldSchema = z.object({ value: requiredNameSchema });

type FieldValues = z.infer<typeof fieldSchema>;

type InlineNameFieldProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  onSave: (value: string) => Promise<void>;
};

export function InlineNameField({
  icon: Icon,
  label,
  value,
  onSave,
}: Readonly<InlineNameFieldProps>) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<FieldValues>({
    resolver: zodResolver(fieldSchema),
    values: { value },
  });

  function cancel() {
    reset({ value });
    setIsEditing(false);
  }

  async function onSubmit(values: FieldValues) {
    if (values.value === value) {
      setIsEditing(false);
      return;
    }

    try {
      await onSave(values.value);
      setIsEditing(false);
      toast({ title: "Profil mis a jour.", variant: "success" });
    } catch (error) {
      toast({
        description: error instanceof Error ? error.message : undefined,
        title: "La mise a jour a echoue.",
        variant: "error",
      });
    }
  }

  if (!isEditing) {
    return (
      <div className="meta-card">
        <div className="meta-head">
          <span className="meta-icon">
            <Icon size={15} />
          </span>
          <span className="meta-label">{label}</span>
        </div>
        <div className="account-field-row">
          <span className="meta-value">{value || "Non renseigne"}</span>
          <button
            aria-label={`Modifier ${label.toLowerCase()}`}
            className="icon-button"
            onClick={() => setIsEditing(true)}
            type="button"
          >
            <Pencil size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="meta-card is-editing account-inline-form"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="meta-head">
        <span className="meta-icon">
          <Icon size={15} />
        </span>
        <span className="meta-label">{label}</span>
      </div>
      <input
        aria-invalid={errors.value ? "true" : undefined}
        aria-label={label}
        autoFocus
        className={errors.value ? "input-error" : undefined}
        {...register("value")}
      />
      {errors.value ? (
        <span className="field-error">{errors.value.message}</span>
      ) : null}
      <div className="account-inline-form-actions">
        <button
          aria-label="Annuler"
          className="icon-button"
          disabled={isSubmitting}
          onClick={cancel}
          type="button"
        >
          <X size={14} />
        </button>
        <button
          aria-label="Enregistrer"
          className="icon-button icon-button-primary"
          disabled={isSubmitting}
          type="submit"
        >
          <Check size={14} />
        </button>
      </div>
    </form>
  );
}
