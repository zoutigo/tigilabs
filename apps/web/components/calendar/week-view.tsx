"use client";

import { addDays, startOfWeek } from "date-fns";
import type { CalendarEvent } from "@tigilabs/types";
import { TimeGrid } from "./time-grid";

type WeekViewProps = {
  anchor: Date;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onCreateSlot: (start: Date) => void;
  onMoveEvent: (event: CalendarEvent, newStart: Date) => void;
};

export function WeekView({
  anchor,
  events,
  onSelectEvent,
  onCreateSlot,
  onMoveEvent,
}: WeekViewProps) {
  const start = startOfWeek(anchor, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));

  return (
    <TimeGrid
      days={days}
      events={events}
      onSelectEvent={onSelectEvent}
      onCreateSlot={onCreateSlot}
      onMoveEvent={onMoveEvent}
    />
  );
}
