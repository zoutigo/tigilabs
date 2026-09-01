"use client";

import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";
import type { CalendarEvent } from "@tigilabs/types";
import { EventCard } from "./event-card";
import { eventsOnDay } from "./calendar-utils";

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MAX_VISIBLE = 3;

type MonthViewProps = {
  anchor: Date;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onSelectDay: (day: Date) => void;
};

export function MonthView({
  anchor,
  events,
  onSelectEvent,
  onSelectDay,
}: MonthViewProps) {
  const start = startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(anchor), { weekStartsOn: 1 });

  const days: Date[] = [];
  for (let day = start; day <= end; day = addDays(day, 1)) {
    days.push(day);
  }

  return (
    <div className="calendar-month">
      <div className="calendar-month-weekdays">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="calendar-month-grid">
        {days.map((day) => {
          const dayEvents = eventsOnDay(events, day);
          const visible = dayEvents.slice(0, MAX_VISIBLE);
          const overflow = dayEvents.length - visible.length;

          return (
            <div
              key={day.toISOString()}
              role="button"
              tabIndex={0}
              className={[
                "calendar-month-cell",
                isSameMonth(day, anchor) ? "" : "calendar-month-cell-outside",
                isToday(day) ? "calendar-month-cell-today" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onSelectDay(day)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  onSelectDay(day);
                }
              }}
            >
              <span className="calendar-month-day-number">
                {format(day, "d", { locale: fr })}
              </span>
              <div className="calendar-month-events">
                {visible.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    compact
                    onClick={(selected) => {
                      onSelectEvent(selected);
                    }}
                  />
                ))}
                {overflow > 0 ? (
                  <span className="calendar-month-more">+{overflow}</span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function isSameCalendarDay(a: Date, b: Date) {
  return isSameDay(a, b);
}
