"use client";

import { MapPin, Users } from "lucide-react";
import type { CalendarEvent } from "@tigilabs/types";
import {
  eventColor,
  formatEventTime,
  isOngoingEvent,
  isPastEvent,
} from "./calendar-utils";

type EventCardProps = {
  event: CalendarEvent;
  compact?: boolean;
  onClick?: (event: CalendarEvent) => void;
};

export function EventCard({ event, compact, onClick }: EventCardProps) {
  const color = eventColor(event);
  const isCancelled = event.status === "CANCELLED";
  const otherParticipants = event.participants.filter(
    (p) => p.userId !== event.organizerId,
  );

  return (
    <button
      type="button"
      className={[
        "calendar-event-chip",
        compact ? "calendar-event-chip-compact" : "",
        isPastEvent(event) ? "calendar-event-chip-past" : "",
        isOngoingEvent(event) ? "calendar-event-chip-ongoing" : "",
        isCancelled ? "calendar-event-chip-cancelled" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ borderLeftColor: color, background: `${color}14` }}
      onClick={(domEvent) => {
        domEvent.stopPropagation();
        onClick?.(event);
      }}
    >
      <span className="calendar-event-chip-time">{formatEventTime(event)}</span>
      <span className="calendar-event-chip-title">
        {event.title}
        {isCancelled ? " (Annule)" : ""}
      </span>
      {!compact && event.location ? (
        <span className="calendar-event-chip-meta">
          <MapPin size={12} /> {event.location}
        </span>
      ) : null}
      {!compact && otherParticipants.length ? (
        <span className="calendar-event-chip-meta">
          <Users size={12} />
          {otherParticipants[0]?.user.name}
          {otherParticipants.length > 1
            ? ` + ${otherParticipants.length - 1}`
            : ""}
        </span>
      ) : null}
    </button>
  );
}
