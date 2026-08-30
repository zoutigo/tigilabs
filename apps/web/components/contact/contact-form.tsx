"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  contactMessageSchema,
  type ContactMessageInput,
} from "@tigilabs/schemas";
import { Send } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { submitContactMessage } from "../../lib/api/contact";
import { Button } from "../ui/button";
import { FormMessage } from "../ui/form-message";
import { Input } from "../ui/input";
import { useToast } from "../ui/toast";

export function ContactForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const mountedAtRef = useRef(Date.now());
  const { toast } = useToast();
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<ContactMessageInput>({
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
      website: "",
    },
    mode: "onChange",
    resolver: zodResolver(contactMessageSchema),
  });

  async function onSubmit(values: ContactMessageInput) {
    setFormError(null);
    try {
      await submitContactMessage({
        ...values,
        startedAt: String(mountedAtRef.current),
      });
      toast({
        title: "Message envoye",
        description: "Merci, l'equipe Tigilabs revient vers vous rapidement.",
        variant: "success",
      });
      reset();
      mountedAtRef.current = Date.now();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Envoi impossible.",
      );
    }
  }

  return (
    <form
      className="form contact-form"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
    >
      <Input
        error={errors.name?.message}
        label="Nom"
        placeholder="Votre nom"
        {...register("name")}
      />
      <Input
        error={errors.email?.message}
        label="Email"
        placeholder="vous@entreprise.com"
        type="email"
        {...register("email")}
      />
      <Input
        error={errors.subject?.message}
        label="Sujet (optionnel)"
        placeholder="Objet de votre demande"
        {...register("subject")}
      />
      <label className="field">
        <span>Message</span>
        <textarea
          aria-invalid={errors.message ? "true" : undefined}
          className={errors.message ? "input-error" : undefined}
          placeholder="Decrivez votre besoin"
          rows={5}
          {...register("message")}
        />
        {errors.message ? (
          <span className="field-error">{errors.message.message}</span>
        ) : null}
      </label>

      {/* Honeypot: hidden from real visitors, only bots tend to fill it in. */}
      <label className="contact-form-honeypot" aria-hidden="true">
        Site web
        <input
          autoComplete="off"
          tabIndex={-1}
          type="text"
          {...register("website")}
        />
      </label>

      {formError ? (
        <FormMessage title="Envoi impossible" variant="error">
          {formError}
        </FormMessage>
      ) : null}

      <Button disabled={isSubmitting} type="submit">
        {isSubmitting ? (
          "Envoi..."
        ) : (
          <>
            Envoyer le message <Send size={16} />
          </>
        )}
      </Button>
    </form>
  );
}
