"use client";

import {
  CalendarClock,
  MapPin,
  Pencil,
  Trash2,
  Users,
  Video,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type {
  CalendarEvent,
  EventHistoryEntry,
  ParticipantStatus,
} from "@tigilabs/types";
import { useCurrentUser } from "../../hooks/use-current-user";
import { useCalendarCategories } from "../../hooks/use-calendar";
import { useUsers } from "../../hooks/use-users";
import {
  deleteEvent,
  getEvent,
  getEventHistory,
  respondToEvent,
  updateEvent,
} from "../../lib/api/calendar";
import { Button } from "../ui/button";
import { Modal } from "../ui/modal";
import { useToast } from "../ui/toast";
import { AttachmentUploader } from "./attachment-uploader";
import { formatEventTime } from "./calendar-utils";
import { EventForm } from "./event-form";

export function EventDetail({ eventId }: Readonly<{ eventId: string }>) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { users } = useUsers();
  const { categories } = useCalendarCategories();
  const { toast } = useToast();

  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [history, setHistory] = useState<EventHistoryEntry[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    getEvent(eventId)
      .then(setEvent)
      .catch(() => setLoadError(true));
    getEventHistory(eventId)
      .then(setHistory)
      .catch(() => setHistory([]));
  }, [eventId]);

  async function handleRespond(status: ParticipantStatus) {
    try {
      const updated = await respondToEvent(eventId, status);
      setEvent(updated);
      toast({ title: "Reponse enregistree", variant: "success" });
    } catch {
      toast({ title: "Reponse impossible", variant: "error" });
    }
  }

  async function handleDelete() {
    if (!event) return;
    try {
      await deleteEvent(event.id, event.seriesId ? "this" : undefined);
      toast({ title: "Evenement supprime", variant: "success" });
      router.push("/calendar");
    } catch {
      toast({ title: "Suppression impossible", variant: "error" });
    }
  }

  if (loadError) {
    return <p className="muted">Cet evenement est introuvable.</p>;
  }

  if (!event) {
    return <p className="muted">Chargement...</p>;
  }

  const isOrganizer = event.organizerId === user.id;
  const myParticipation = event.participants.find((p) => p.userId === user.id);

  return (
    <div className="event-detail">
      <div className="toolbar">
        <h2>{event.title}</h2>
        {isOrganizer ? (
          <div className="button-row">
            <Button variant="secondary" onClick={() => setIsEditing(true)}>
              <Pencil size={14} /> Modifier
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 size={14} /> Supprimer
            </Button>
          </div>
        ) : null}
      </div>

      {event.category ? (
        <span
          className="category-chip category-chip-active"
          style={{ borderColor: event.category.color }}
        >
          <span
            className="category-dot"
            style={{ background: event.category.color }}
          />
          {event.category.name}
        </span>
      ) : null}

      <p className="event-popover-row">
        <CalendarClock size={16} /> {formatEventTime(event)}
      </p>
      {event.location ? (
        <p className="event-popover-row">
          <MapPin size={16} /> {event.location}
        </p>
      ) : null}
      {event.meetingUrl ? (
        <p className="event-popover-row">
          <Video size={16} />
          <a href={event.meetingUrl} target="_blank" rel="noreferrer">
            {event.meetingUrl}
          </a>
        </p>
      ) : null}
      {event.description ? <p>{event.description}</p> : null}

      <section className="card">
        <h3>
          <Users size={16} /> Participants
        </h3>
        <ul className="participant-status-list">
          {event.participants.map((participant) => (
            <li key={participant.userId}>
              {participant.user.name}
              <span
                className={`badge badge-${statusBadge(participant.status)}`}
              >
                {statusLabel(participant.status)}
              </span>
            </li>
          ))}
        </ul>
        {myParticipation && !isOrganizer ? (
          <div className="button-row">
            <Button
              variant="secondary"
              onClick={() => handleRespond("ACCEPTED")}
            >
              Accepter
            </Button>
            <Button variant="ghost" onClick={() => handleRespond("TENTATIVE")}>
              Peut-etre
            </Button>
            <Button variant="danger" onClick={() => handleRespond("DECLINED")}>
              Refuser
            </Button>
          </div>
        ) : null}
      </section>

      <section className="card">
        <h3>Pieces jointes</h3>
        <AttachmentUploader
          eventId={event.id}
          attachments={event.attachments}
          currentUserId={user.id}
          canDeleteOthers={user.permissions?.includes(
            "calendar.attachment.delete_others",
          )}
          onChange={(attachments) => setEvent({ ...event, attachments })}
        />
      </section>

      {history.length ? (
        <section className="card">
          <h3>Historique</h3>
          <ul className="event-history-list">
            {history.map((entry) => (
              <li key={entry.id}>
                <strong>{entry.user?.name ?? "Utilisateur"}</strong> -{" "}
                {describeHistory(entry)}
                <span className="muted">
                  {" "}
                  ({new Date(entry.createdAt).toLocaleString("fr-FR")})
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Modal
        title="Modifier l'evenement"
        open={isEditing}
        onClose={() => setIsEditing(false)}
      >
        <EventForm
          users={users}
          categories={categories}
          currentUserId={user.id}
          submitLabel="Enregistrer"
          defaultValues={eventToFormValues(event)}
          onCancel={() => setIsEditing(false)}
          onSubmit={async (payload) => {
            try {
              const updated = await updateEvent(
                event.id,
                payload,
                event.seriesId ? "this" : undefined,
              );
              setEvent(updated);
              setIsEditing(false);
              toast({ title: "Evenement mis a jour", variant: "success" });
            } catch {
              toast({ title: "Mise a jour impossible", variant: "error" });
            }
          }}
        />
      </Modal>
    </div>
  );
}

function statusLabel(status: ParticipantStatus) {
  return {
    PENDING: "En attente",
    ACCEPTED: "Accepte",
    DECLINED: "Refuse",
    TENTATIVE: "Peut-etre",
  }[status];
}

function statusBadge(status: ParticipantStatus) {
  return {
    PENDING: "warning",
    ACCEPTED: "success",
    DECLINED: "danger",
    TENTATIVE: "neutral",
  }[status];
}

function describeHistory(entry: EventHistoryEntry) {
  const labels: Record<string, string> = {
    EVENT_CREATED: "a cree l'evenement",
    TITLE_CHANGED: "a modifie le titre",
    STARTAT_CHANGED: "a modifie l'horaire de debut",
    ENDAT_CHANGED: "a modifie l'horaire de fin",
    LOCATION_CHANGED: "a modifie le lieu",
    PRIVACY_CHANGED: "a modifie la confidentialite",
    PARTICIPANT_RESPONDED: "a repondu a l'invitation",
  };
  return labels[entry.action] ?? entry.action;
}

function eventToFormValues(event: CalendarEvent) {
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
