"use client";

import { createEventSchema, type CreateEventInput } from "@tigilabs/schemas";
import { AlignLeft, Link2, MapPin, Repeat } from "lucide-react";
import { useForm } from "react-hook-form";
import type {
  CalendarCategory,
  CreateEventPayload,
  EventPrivacy,
  EventReminder,
  RecurrenceFrequency,
  User,
} from "@tigilabs/types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { CategorySelector } from "./category-selector";
import { ParticipantPicker } from "./participant-picker";
import { ReminderSelector } from "./reminder-selector";

export type EventFormValues = {
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  location?: string;
  meetingUrl?: string;
  categoryId?: string;
  privacy: EventPrivacy;
  participantIds: string[];
  reminders: EventReminder[];
  recurrenceEnabled: boolean;
  recurrenceFrequency: RecurrenceFrequency;
  recurrenceInterval: number;
  recurrenceUntil?: string;
};

type EventFormProps = {
  defaultValues?: Partial<EventFormValues>;
  users: User[];
  categories: CalendarCategory[];
  currentUserId?: string;
  submitLabel: string;
  onSubmit: (payload: CreateEventPayload) => Promise<void> | void;
  onCancel: () => void;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const DEFAULT_VALUES: EventFormValues = {
  title: "",
  description: "",
  date: todayIso(),
  startTime: "09:00",
  endTime: "10:00",
  allDay: false,
  location: "",
  meetingUrl: "",
  categoryId: undefined,
  privacy: "NORMAL",
  participantIds: [],
  reminders: [{ minutesBefore: 30, channel: "EMAIL" }],
  recurrenceEnabled: false,
  recurrenceFrequency: "WEEKLY",
  recurrenceInterval: 1,
  recurrenceUntil: undefined,
};

export function EventForm({
  defaultValues,
  users,
  categories,
  currentUserId,
  submitLabel,
  onSubmit,
  onCancel,
}: EventFormProps) {
  const form = useForm<EventFormValues>({
    defaultValues: { ...DEFAULT_VALUES, ...defaultValues },
  });

  const { watch, setValue, register, handleSubmit, formState } = form;
  const allDay = watch("allDay");
  const recurrenceEnabled = watch("recurrenceEnabled");

  async function handleFormSubmit(values: EventFormValues) {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const startAt = values.allDay
      ? new Date(`${values.date}T00:00:00`).toISOString()
      : new Date(`${values.date}T${values.startTime}:00`).toISOString();
    const endAt = values.allDay
      ? new Date(`${values.date}T23:59:59`).toISOString()
      : new Date(`${values.date}T${values.endTime}:00`).toISOString();

    const candidate: CreateEventInput = {
      title: values.title,
      description: values.description || undefined,
      startAt,
      endAt,
      allDay: values.allDay,
      timezone,
      location: values.location || undefined,
      meetingUrl: values.meetingUrl || undefined,
      categoryId: values.categoryId,
      privacy: values.privacy,
      participantIds: values.participantIds,
      reminders: values.reminders,
      recurrence: values.recurrenceEnabled
        ? {
            frequency: values.recurrenceFrequency,
            interval: values.recurrenceInterval,
            until: values.recurrenceUntil
              ? new Date(`${values.recurrenceUntil}T23:59:59`).toISOString()
              : undefined,
          }
        : undefined,
    };

    const parsed = createEventSchema.safeParse(candidate);
    if (!parsed.success) {
      form.setError("root", {
        message: parsed.error.issues[0]?.message ?? "Formulaire invalide.",
      });
      return;
    }

    await onSubmit(candidate);
  }

  return (
    <form
      className="form event-form"
      onSubmit={handleSubmit(handleFormSubmit)}
      noValidate
    >
      <Input
        label="Titre"
        placeholder="Reunion preparation deploiement"
        error={formState.errors.title?.message}
        {...register("title", { required: "Le titre est obligatoire." })}
      />

      <label className="field">
        <span>
          <AlignLeft size={14} /> Description
        </span>
        <textarea
          rows={4}
          placeholder="Contexte, ordre du jour..."
          {...register("description")}
        />
      </label>

      <div className="event-form-row">
        <label className="field-checkbox">
          <input type="checkbox" {...register("allDay")} />
          Toute la journee
        </label>
      </div>

      <div className="event-form-row">
        <Input
          label="Date"
          type="date"
          {...register("date", { required: true })}
        />
        {!allDay ? (
          <>
            <Input
              label="Debut"
              type="time"
              {...register("startTime", { required: !allDay })}
            />
            <Input
              label="Fin"
              type="time"
              {...register("endTime", { required: !allDay })}
            />
          </>
        ) : null}
      </div>

      <div className="event-form-row">
        <Input
          label="Lieu"
          placeholder="Bureau Tigilabs Douala"
          {...register("location")}
        />
        <label className="field">
          <span>
            <Link2 size={14} /> Lien de visioconference
          </span>
          <input placeholder="https://..." {...register("meetingUrl")} />
        </label>
      </div>

      <label className="field">
        <span>
          <MapPin size={14} /> Categorie
        </span>
        <CategorySelector
          categories={categories}
          value={watch("categoryId")}
          onChange={(value) => setValue("categoryId", value)}
        />
      </label>

      <label className="field">
        <span>Confidentialite</span>
        <select {...register("privacy")}>
          <option value="NORMAL">Normal</option>
          <option value="PRIVATE">Prive (les autres voient "Occupe")</option>
          <option value="RESTRICTED">
            Restreint (organisateur + participants)
          </option>
        </select>
      </label>

      <label className="field">
        <span>Participants</span>
        <ParticipantPicker
          users={users}
          selectedIds={watch("participantIds")}
          excludeUserId={currentUserId}
          onChange={(ids) => setValue("participantIds", ids)}
        />
      </label>

      <label className="field">
        <span>Rappels</span>
        <ReminderSelector
          value={watch("reminders")}
          onChange={(reminders) => setValue("reminders", reminders)}
        />
      </label>

      <div className="event-form-row">
        <label className="field-checkbox">
          <input type="checkbox" {...register("recurrenceEnabled")} />
          <Repeat size={14} /> Evenement recurrent
        </label>
      </div>

      {recurrenceEnabled ? (
        <div className="event-form-row">
          <label className="field">
            <span>Frequence</span>
            <select {...register("recurrenceFrequency")}>
              <option value="DAILY">Tous les jours</option>
              <option value="WEEKLY">Chaque semaine</option>
              <option value="BIWEEKLY">Toutes les 2 semaines</option>
              <option value="MONTHLY">Chaque mois</option>
              <option value="YEARLY">Chaque annee</option>
            </select>
          </label>
          <Input
            label="Intervalle"
            type="number"
            min={1}
            {...register("recurrenceInterval", { valueAsNumber: true })}
          />
          <Input
            label="Jusqu'au"
            type="date"
            {...register("recurrenceUntil")}
          />
        </div>
      ) : null}

      {formState.errors.root?.message ? (
        <p className="field-error">{formState.errors.root.message}</p>
      ) : null}

      <div className="button-row">
        <Button type="submit" disabled={formState.isSubmitting}>
          {submitLabel}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
