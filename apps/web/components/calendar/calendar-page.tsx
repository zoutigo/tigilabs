"use client";

import { useMemo, useState } from "react";
import type {
  CalendarEvent,
  CreateEventPayload,
  ParticipantStatus,
  UpdateEventPayload,
} from "@tigilabs/types";
import { useCurrentUser } from "../../hooks/use-current-user";
import {
  useCalendarCategories,
  useCalendarEvents,
} from "../../hooks/use-calendar";
import { useUsers } from "../../hooks/use-users";
import {
  createEvent,
  deleteEvent as deleteEventApi,
  respondToEvent,
  updateEvent as updateEventApi,
} from "../../lib/api/calendar";
import { Modal } from "../ui/modal";
import { useToast } from "../ui/toast";
import { AgendaView, isEventVisible } from "./agenda-view";
import { CalendarHeader } from "./calendar-header";
import { DayView } from "./day-view";
import { EventForm, type EventFormValues } from "./event-form";
import { EventPopover } from "./event-popover";
import { MonthView } from "./month-view";
import { WeekView } from "./week-view";
import type { CalendarViewMode } from "./calendar-utils";
import { getRangeForView, shiftAnchor } from "./calendar-utils";

function useDefaultViewMode(): CalendarViewMode {
  if (typeof window === "undefined") {
    return "week";
  }
  return window.innerWidth < 768 ? "agenda" : "week";
}

export function CalendarPage() {
  const { user } = useCurrentUser();
  const { users } = useUsers();
  const { categories } = useCalendarCategories();
  const { toast } = useToast();

  const [mode, setMode] = useState<CalendarViewMode>(useDefaultViewMode);
  const [anchor, setAnchor] = useState(() => new Date());
  const [search, setSearch] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );
  const [formState, setFormState] = useState<
    | { mode: "create"; defaults?: Partial<EventFormValues> }
    | { mode: "edit"; event: CalendarEvent }
    | null
  >(null);

  const range = useMemo(() => getRangeForView(mode, anchor), [mode, anchor]);
  const { events, refetch } = useCalendarEvents(
    range.from.toISOString(),
    range.to.toISOString(),
  );

  const visibleEvents = useMemo(
    () => events.filter((event) => isEventVisible(event, search, null)),
    [events, search],
  );

  function openCreateAt(start: Date) {
    const end = new Date(start.getTime() + 60 * 60_000);
    setFormState({
      mode: "create",
      defaults: {
        date: start.toISOString().slice(0, 10),
        startTime: start.toTimeString().slice(0, 5),
        endTime: end.toTimeString().slice(0, 5),
      },
    });
  }

  async function handleCreate(payload: CreateEventPayload) {
    try {
      await createEvent(payload);
      toast({ title: "Evenement cree", variant: "success" });
      setFormState(null);
      await refetch();
    } catch (error) {
      toast({
        title: "Creation impossible",
        description:
          error instanceof Error
            ? error.message
            : "Reessayez dans quelques instants.",
        variant: "error",
      });
    }
  }

  async function handleUpdate(eventId: string, payload: CreateEventPayload) {
    try {
      const {
        timezone: _timezone,
        generateMeetingLink: _generateMeetingLink,
        recurrence: _recurrence,
        reminders,
        ...rest
      } = payload;
      const updatePayload: UpdateEventPayload = {
        ...rest,
        reminders: reminders?.map(({ minutesBefore, channel }) => ({
          minutesBefore,
          channel,
        })),
      };
      await updateEventApi(eventId, updatePayload);
      toast({ title: "Evenement mis a jour", variant: "success" });
      setFormState(null);
      setSelectedEvent(null);
      await refetch();
    } catch {
      toast({ title: "Mise a jour impossible", variant: "error" });
    }
  }

  async function handleMoveEvent(event: CalendarEvent, newStart: Date) {
    const durationMs =
      new Date(event.endAt).getTime() - new Date(event.startAt).getTime();
    const newEnd = new Date(newStart.getTime() + durationMs);

    try {
      await updateEventApi(
        event.id,
        { startAt: newStart.toISOString(), endAt: newEnd.toISOString() },
        event.seriesId ? "this" : undefined,
      );
      toast({
        title: "Rendez-vous deplace",
        description: newStart.toLocaleString("fr-FR", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
        variant: "success",
      });
      await refetch();
    } catch {
      toast({ title: "Deplacement impossible", variant: "error" });
    }
  }

  async function handleDelete(event: CalendarEvent) {
    try {
      await deleteEventApi(event.id, event.seriesId ? "this" : undefined);
      toast({ title: "Evenement supprime", variant: "success" });
      setSelectedEvent(null);
      await refetch();
    } catch {
      toast({ title: "Suppression impossible", variant: "error" });
    }
  }

  async function handleRespond(
    event: CalendarEvent,
    status: ParticipantStatus,
  ) {
    try {
      await respondToEvent(event.id, status);
      toast({ title: "Reponse enregistree", variant: "success" });
      setSelectedEvent(null);
      await refetch();
    } catch {
      toast({ title: "Reponse impossible", variant: "error" });
    }
  }

  return (
    <div className="calendar-page">
      <CalendarHeader
        mode={mode}
        anchor={anchor}
        search={search}
        onModeChange={setMode}
        onNavigate={(direction) =>
          setAnchor((current) => shiftAnchor(mode, current, direction))
        }
        onToday={() => setAnchor(new Date())}
        onSearchChange={setSearch}
        onCreate={() => setFormState({ mode: "create" })}
      />

      <div className="calendar-body">
        {mode === "day" ? (
          <DayView
            anchor={anchor}
            events={visibleEvents}
            onSelectEvent={setSelectedEvent}
            onCreateSlot={openCreateAt}
            onMoveEvent={handleMoveEvent}
          />
        ) : null}
        {mode === "week" ? (
          <WeekView
            anchor={anchor}
            events={visibleEvents}
            onSelectEvent={setSelectedEvent}
            onCreateSlot={openCreateAt}
            onMoveEvent={handleMoveEvent}
          />
        ) : null}
        {mode === "month" ? (
          <MonthView
            anchor={anchor}
            events={visibleEvents}
            onSelectEvent={setSelectedEvent}
            onSelectDay={(day) => {
              setAnchor(day);
              setMode("day");
            }}
          />
        ) : null}
        {mode === "agenda" ? (
          <AgendaView
            events={visibleEvents}
            onSelect={setSelectedEvent}
            onCreate={() => setFormState({ mode: "create" })}
          />
        ) : null}
      </div>

      <EventPopover
        event={selectedEvent}
        currentUserId={user.id}
        onClose={() => setSelectedEvent(null)}
        onEdit={(event) => {
          setSelectedEvent(null);
          setFormState({ mode: "edit", event });
        }}
        onDelete={handleDelete}
        onRespond={handleRespond}
      />

      <Modal
        title={
          formState?.mode === "edit"
            ? "Modifier l'evenement"
            : "Nouveau rendez-vous"
        }
        open={Boolean(formState)}
        onClose={() => setFormState(null)}
      >
        {formState ? (
          <EventForm
            users={users}
            categories={categories}
            currentUserId={user.id}
            submitLabel={formState.mode === "edit" ? "Enregistrer" : "Creer"}
            defaultValues={
              formState.mode === "edit"
                ? eventToFormValues(formState.event)
                : formState.defaults
            }
            onCancel={() => setFormState(null)}
            onSubmit={(payload) =>
              formState.mode === "edit"
                ? handleUpdate(formState.event.id, payload)
                : handleCreate(payload)
            }
          />
        ) : null}
      </Modal>
    </div>
  );
}

function eventToFormValues(event: CalendarEvent): Partial<EventFormValues> {
  const start = new Date(event.startAt);
  const end = new Date(event.endAt);

  return {
    title: event.title,
    description: event.description ?? "",
    date: start.toISOString().slice(0, 10),
    startTime: start.toTimeString().slice(0, 5),
    endTime: end.toTimeString().slice(0, 5),
    allDay: event.allDay,
    location: event.location ?? "",
    meetingUrl: event.meetingUrl ?? "",
    categoryId: event.categoryId ?? undefined,
    privacy: event.privacy,
    participantIds: event.participants
      .filter((p) => p.userId !== event.organizerId)
      .map((p) => p.userId),
    reminders: event.reminders,
  };
}
