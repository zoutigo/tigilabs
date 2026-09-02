"use client";

import { format, isSameDay, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { useRef } from "react";
import type { CalendarEvent } from "@tigilabs/types";
import { eventColor, formatEventTime, isPastEvent } from "./calendar-utils";

const ROW_HEIGHT = 48;
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const SNAP_MINUTES = 15;

type PositionedEvent = {
  event: CalendarEvent;
  top: number;
  height: number;
  column: number;
  columnCount: number;
};

function layoutDay(events: CalendarEvent[], day: Date): PositionedEvent[] {
  const dayEvents = events
    .filter((event) => !event.allDay)
    .filter((event) => isSameDay(new Date(event.startAt), day))
    .sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );

  const columns: CalendarEvent[][] = [];

  for (const event of dayEvents) {
    const start = new Date(event.startAt).getTime();
    let placed = false;
    for (const column of columns) {
      const last = column[column.length - 1];
      if (new Date(last.endAt).getTime() <= start) {
        column.push(event);
        placed = true;
        break;
      }
    }
    if (!placed) {
      columns.push([event]);
    }
  }

  const columnCount = Math.max(columns.length, 1);

  return dayEvents.map((event) => {
    const columnIndex = columns.findIndex((column) => column.includes(event));
    const start = new Date(event.startAt);
    const end = new Date(event.endAt);
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = Math.max(
      startMinutes + 15,
      end.getHours() * 60 + end.getMinutes(),
    );

    return {
      event,
      top: (startMinutes / 60) * ROW_HEIGHT,
      height: ((endMinutes - startMinutes) / 60) * ROW_HEIGHT,
      column: columnIndex,
      columnCount,
    };
  });
}

type TimeGridProps = {
  days: Date[];
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onCreateSlot: (start: Date) => void;
  onMoveEvent: (event: CalendarEvent, newStart: Date) => void;
};

export function TimeGrid({
  days,
  events,
  onSelectEvent,
  onCreateSlot,
  onMoveEvent,
}: TimeGridProps) {
  const columnRefs = useRef<Array<HTMLDivElement | null>>([]);

  function computeMinutesFromOffset(offsetY: number) {
    const rawMinutes = (offsetY / ROW_HEIGHT) * 60;
    return Math.max(0, Math.round(rawMinutes / SNAP_MINUTES) * SNAP_MINUTES);
  }

  function handleColumnClick(
    day: Date,
    columnEl: HTMLDivElement,
    clientY: number,
  ) {
    const rect = columnEl.getBoundingClientRect();
    const minutes = computeMinutesFromOffset(clientY - rect.top);
    const start = new Date(day);
    start.setHours(0, minutes, 0, 0);
    onCreateSlot(start);
  }

  function handleDrop(
    day: Date,
    columnEl: HTMLDivElement,
    clientY: number,
    eventId: string,
  ) {
    const event = events.find((item) => item.id === eventId);
    if (!event) {
      return;
    }
    const rect = columnEl.getBoundingClientRect();
    const minutes = computeMinutesFromOffset(clientY - rect.top);
    const newStart = new Date(day);
    newStart.setHours(0, minutes, 0, 0);
    onMoveEvent(event, newStart);
  }

  const allDayEvents = events.filter((event) => event.allDay);
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return (
    <div
      className="calendar-timegrid"
      style={{ "--calendar-days": days.length } as React.CSSProperties}
    >
      <div className="calendar-timegrid-header">
        <div className="calendar-timegrid-gutter" />
        {days.map((day) => (
          <div key={day.toISOString()} className="calendar-timegrid-daylabel">
            <span className="calendar-timegrid-daylabel-name">
              {format(day, "EEE", { locale: fr })}
            </span>
            <span
              className={`calendar-timegrid-daylabel-number${isToday(day) ? " calendar-timegrid-daylabel-today" : ""}`}
            >
              {format(day, "d", { locale: fr })}
            </span>
          </div>
        ))}
      </div>

      {allDayEvents.length ? (
        <div className="calendar-timegrid-allday">
          <div className="calendar-timegrid-gutter">Journee</div>
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className="calendar-timegrid-allday-cell"
            >
              {allDayEvents
                .filter((event) => isSameDay(new Date(event.startAt), day))
                .map((event) => (
                  <button
                    type="button"
                    key={event.id}
                    className="calendar-event-chip calendar-event-chip-compact"
                    style={{
                      borderLeftColor: eventColor(event),
                      background: `${eventColor(event)}14`,
                    }}
                    onClick={() => onSelectEvent(event)}
                  >
                    {event.title}
                  </button>
                ))}
            </div>
          ))}
        </div>
      ) : null}

      <div className="calendar-timegrid-body">
        <div className="calendar-timegrid-gutter calendar-timegrid-hours">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="calendar-timegrid-hour-label"
              style={{ height: ROW_HEIGHT }}
            >
              {String(hour).padStart(2, "0")}:00
            </div>
          ))}
        </div>
        {days.map((day, dayIndex) => {
          const positioned = layoutDay(events, day);

          return (
            <div
              key={day.toISOString()}
              className="calendar-timegrid-column"
              style={{ height: ROW_HEIGHT * 24 }}
              ref={(el) => {
                columnRefs.current[dayIndex] = el;
              }}
              onClick={(domEvent) => {
                handleColumnClick(
                  day,
                  domEvent.currentTarget,
                  domEvent.clientY,
                );
              }}
              onDragOver={(domEvent) => domEvent.preventDefault()}
              onDrop={(domEvent) => {
                domEvent.preventDefault();
                const eventId = domEvent.dataTransfer.getData("text/event-id");
                if (eventId) {
                  handleDrop(
                    day,
                    domEvent.currentTarget,
                    domEvent.clientY,
                    eventId,
                  );
                }
              }}
            >
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="calendar-timegrid-row"
                  style={{ height: ROW_HEIGHT }}
                />
              ))}
              {isToday(day) ? (
                <div
                  className="calendar-timegrid-now-line"
                  style={{ top: (nowMinutes / 60) * ROW_HEIGHT }}
                />
              ) : null}
              {positioned.map(({ event, top, height, column, columnCount }) => (
                <button
                  type="button"
                  key={event.id}
                  draggable
                  onDragStart={(domEvent) => {
                    domEvent.dataTransfer.setData("text/event-id", event.id);
                  }}
                  className={[
                    "calendar-event-block",
                    isPastEvent(event) ? "calendar-event-chip-past" : "",
                    event.status === "CANCELLED"
                      ? "calendar-event-chip-cancelled"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{
                    top,
                    height: Math.max(height, 20),
                    left: `${(column / columnCount) * 100}%`,
                    width: `${100 / columnCount}%`,
                    borderLeftColor: eventColor(event),
                    background: `${eventColor(event)}1f`,
                  }}
                  onClick={(domEvent) => {
                    domEvent.stopPropagation();
                    onSelectEvent(event);
                  }}
                >
                  <span className="calendar-event-block-title">
                    {event.title}
                  </span>
                  <span className="calendar-event-block-time">
                    {formatEventTime(event)}
                  </span>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
