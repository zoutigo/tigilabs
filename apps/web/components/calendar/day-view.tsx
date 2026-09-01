"use client";

import type { CalendarEvent } from "@tigilabs/types";
import { TimeGrid } from "./time-grid";

type DayViewProps = {
  anchor: Date;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onCreateSlot: (start: Date) => void;
  onMoveEvent: (event: CalendarEvent, newStart: Date) => void;
};

export function DayView({
  anchor,
  events,
  onSelectEvent,
  onCreateSlot,
  onMoveEvent,
}: DayViewProps) {
  return (
    <TimeGrid
      days={[anchor]}
      events={events}
      onSelectEvent={onSelectEvent}
      onCreateSlot={onCreateSlot}
      onMoveEvent={onMoveEvent}
    />
  );
}
