"use client";

import { CalendarPlus } from "lucide-react";
import { isSameDay, isSameWeek, isWithinInterval } from "date-fns";
import type { CalendarEvent } from "@tigilabs/types";
import { Button } from "../ui/button";
import { EventCard } from "./event-card";

type AgendaViewProps = {
  events: CalendarEvent[];
  onSelect: (event: CalendarEvent) => void;
  onCreate: () => void;
};

function groupLabel(event: CalendarEvent, now: Date) {
  const start = new Date(event.startAt);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (isSameDay(start, now)) {
    return "Aujourd'hui";
  }
  if (isSameDay(start, tomorrow)) {
    return "Demain";
  }
  if (isSameWeek(start, now, { weekStartsOn: 1 }) && start > now) {
    return "Cette semaine";
  }
  return "Plus tard";
}

const GROUP_ORDER = ["Aujourd'hui", "Demain", "Cette semaine", "Plus tard"];

export function AgendaView({ events, onSelect, onCreate }: AgendaViewProps) {
  const now = new Date();
  const upcoming = events
    .filter((event) => new Date(event.endAt) >= now)
    .sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );

  if (!upcoming.length) {
    return (
      <div className="calendar-empty-state">
        <p className="calendar-empty-title">Aucun rendez-vous a venir</p>
        <p className="muted">Profitez-en, votre agenda est libre.</p>
        <Button onClick={onCreate}>
          <CalendarPlus size={16} />
          Planifier un rendez-vous
        </Button>
      </div>
    );
  }

  const groups = new Map<string, CalendarEvent[]>();
  for (const event of upcoming) {
    const label = groupLabel(event, now);
    const list = groups.get(label) ?? [];
    list.push(event);
    groups.set(label, list);
  }

  return (
    <div className="calendar-agenda">
      {GROUP_ORDER.filter((label) => groups.has(label)).map((label) => (
        <section key={label} className="calendar-agenda-group">
          <h3 className="calendar-agenda-group-title">{label}</h3>
          <div className="calendar-agenda-list">
            {groups.get(label)!.map((event) => (
              <EventCard key={event.id} event={event} onClick={onSelect} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function isEventVisible(
  event: CalendarEvent,
  query: string,
  categoryId: string | null,
) {
  if (categoryId && event.categoryId !== categoryId) {
    return false;
  }
  if (!query) {
    return true;
  }
  const needle = query.toLowerCase();
  return (
    event.title.toLowerCase().includes(needle) ||
    (event.description ?? "").toLowerCase().includes(needle) ||
    (event.location ?? "").toLowerCase().includes(needle) ||
    event.participants.some((p) => p.user.name.toLowerCase().includes(needle))
  );
}

export function withinRange(event: CalendarEvent, from: Date, to: Date) {
  const start = new Date(event.startAt);
  const end = new Date(event.endAt);
  return (
    isWithinInterval(start, { start: from, end: to }) ||
    isWithinInterval(end, { start: from, end: to }) ||
    (start <= from && end >= to)
  );
}
