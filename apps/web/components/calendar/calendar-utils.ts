import {
  addDays,
  addMonths,
  addWeeks,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";
import type { CalendarEvent } from "@tigilabs/types";

export type CalendarViewMode = "day" | "week" | "month" | "agenda";

export function getRangeForView(mode: CalendarViewMode, anchor: Date) {
  switch (mode) {
    case "day":
      return { from: startOfDay(anchor), to: endOfDay(anchor) };
    case "week":
      return {
        from: startOfWeek(anchor, { weekStartsOn: 1 }),
        to: endOfWeek(anchor, { weekStartsOn: 1 }),
      };
    case "month":
      return {
        from: startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 }),
        to: endOfWeek(endOfMonth(anchor), { weekStartsOn: 1 }),
      };
    case "agenda":
      return { from: startOfDay(anchor), to: addDays(startOfDay(anchor), 30) };
  }
}

export function shiftAnchor(
  mode: CalendarViewMode,
  anchor: Date,
  direction: 1 | -1,
) {
  switch (mode) {
    case "day":
      return addDays(anchor, direction);
    case "week":
      return addWeeks(anchor, direction);
    case "month":
      return addMonths(anchor, direction);
    case "agenda":
      return addDays(anchor, 30 * direction);
  }
}

export function eventsOnDay(events: CalendarEvent[], day: Date) {
  return events
    .filter((event) => {
      const start = new Date(event.startAt);
      const end = new Date(event.endAt);
      return (
        isSameDay(start, day) ||
        isSameDay(end, day) ||
        isWithinInterval(day, { start, end })
      );
    })
    .sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );
}

export function formatEventTime(event: CalendarEvent) {
  if (event.allDay) {
    return "Toute la journee";
  }
  return `${format(new Date(event.startAt), "HH:mm")} - ${format(new Date(event.endAt), "HH:mm")}`;
}

export function formatRangeLabel(mode: CalendarViewMode, anchor: Date) {
  switch (mode) {
    case "day":
      return format(anchor, "EEEE d MMMM yyyy", { locale: fr });
    case "week": {
      const from = startOfWeek(anchor, { weekStartsOn: 1 });
      const to = endOfWeek(anchor, { weekStartsOn: 1 });
      return `${format(from, "d MMM", { locale: fr })} - ${format(to, "d MMM yyyy", { locale: fr })}`;
    }
    case "month":
      return format(anchor, "MMMM yyyy", { locale: fr });
    case "agenda":
      return "Prochains evenements";
  }
}

export function isPastEvent(event: CalendarEvent) {
  return new Date(event.endAt).getTime() < Date.now();
}

export function isOngoingEvent(event: CalendarEvent) {
  const now = Date.now();
  return (
    new Date(event.startAt).getTime() <= now &&
    new Date(event.endAt).getTime() >= now
  );
}

export function isImminentEvent(event: CalendarEvent) {
  const now = Date.now();
  const start = new Date(event.startAt).getTime();
  return start > now && start - now <= 15 * 60_000;
}

export function eventColor(event: CalendarEvent) {
  return event.category?.color ?? "#2563EB";
}

export { format };
