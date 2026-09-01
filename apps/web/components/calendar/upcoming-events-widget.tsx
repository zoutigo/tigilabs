"use client";

import { CalendarDays, CalendarPlus } from "lucide-react";
import Link from "next/link";
import { isToday, isTomorrow } from "date-fns";
import { useUpcomingEvents } from "../../hooks/use-calendar";
import { formatEventTime, eventColor } from "./calendar-utils";

function dayLabel(startAt: string) {
  const date = new Date(startAt);
  if (isToday(date)) return "Aujourd'hui";
  if (isTomorrow(date)) return "Demain";
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function UpcomingEventsWidget() {
  const { events } = useUpcomingEvents();
  const upcoming = events.slice(0, 5);

  return (
    <section className="dashboard-panel upcoming-events-widget">
      <div className="panel-heading">
        <h3>
          <CalendarDays size={16} />
          Prochains rendez-vous
        </h3>
      </div>

      {upcoming.length ? (
        <ul className="upcoming-events-list">
          {upcoming.map((event) => (
            <li key={event.id} className="upcoming-events-item">
              <span
                className="upcoming-events-dot"
                style={{ background: eventColor(event) }}
              />
              <div>
                <p className="upcoming-events-time">
                  {dayLabel(event.startAt)} &middot; {formatEventTime(event)}
                </p>
                <p className="upcoming-events-title">{event.title}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">Aucun rendez-vous a venir.</p>
      )}

      <div className="button-row">
        <Link className="panel-link" href="/calendar">
          Voir tout l&apos;agenda
        </Link>
        <Link className="tl-button" href="/calendar">
          <CalendarPlus size={16} />
          Nouveau rendez-vous
        </Link>
      </div>
    </section>
  );
}
