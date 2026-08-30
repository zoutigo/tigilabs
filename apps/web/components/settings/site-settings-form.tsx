"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { siteSettingsSchema, type SiteSettingsInput } from "@tigilabs/schemas";
import type { SiteSettings } from "@tigilabs/types";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSiteSettings } from "../../hooks/use-site-settings";
import { updateSiteSettings } from "../../lib/api/settings";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useToast } from "../ui/toast";

function toFormValues(settings: SiteSettings): SiteSettingsInput {
  return { ...settings, address: settings.address ?? "" };
}

export function SiteSettingsForm() {
  const { settings } = useSiteSettings();
  const { toast } = useToast();
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<SiteSettingsInput>({
    defaultValues: toFormValues(settings),
    mode: "onChange",
    resolver: zodResolver(siteSettingsSchema),
  });

  useEffect(() => {
    reset(toFormValues(settings));
  }, [reset, settings]);

  async function onSubmit(values: SiteSettingsInput) {
    try {
      await updateSiteSettings(values);
      toast({ title: "Parametres du site mis a jour.", variant: "success" });
    } catch (error) {
      toast({
        title:
          error instanceof Error
            ? error.message
            : "La mise a jour des parametres a echoue.",
        variant: "error",
      });
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit(onSubmit)}>
      <Input
        error={errors.companyName?.message}
        label="Nom de l'entreprise"
        {...register("companyName")}
      />
      <Input
        error={errors.ownerName?.message}
        label="Nom du responsable"
        {...register("ownerName")}
      />
      <Input
        error={errors.contactEmail?.message}
        label="Email de contact"
        type="email"
        {...register("contactEmail")}
      />
      <Input
        error={errors.contactPhone?.message}
        label="Telephone de contact"
        {...register("contactPhone")}
      />
      <Input
        error={errors.address?.message}
        label="Adresse (optionnel)"
        {...register("address")}
      />
      <label className="field">
        <span>Politique de confidentialite</span>
        <textarea
          aria-invalid={errors.privacyPolicy ? "true" : undefined}
          className={errors.privacyPolicy ? "input-error" : undefined}
          rows={8}
          {...register("privacyPolicy")}
        />
        {errors.privacyPolicy ? (
          <span className="field-error">{errors.privacyPolicy.message}</span>
        ) : null}
      </label>
      <Button disabled={isSubmitting} type="submit">
        {isSubmitting ? "Enregistrement..." : "Enregistrer"}
      </Button>
    </form>
  );
}
