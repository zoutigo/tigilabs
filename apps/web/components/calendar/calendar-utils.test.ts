import type { CalendarEvent } from "@tigilabs/types";
import { describe, expect, it } from "vitest";
import {
  eventsOnDay,
  formatEventTime,
  getRangeForView,
  isImminentEvent,
  isOngoingEvent,
  isPastEvent,
  shiftAnchor,
} from "./calendar-utils";

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: "event-1",
    title: "Reunion",
    description: null,
    startAt: new Date(2026, 1, 2, 9, 0).toISOString(),
    endAt: new Date(2026, 1, 2, 10, 0).toISOString(),
    allDay: false,
    privacy: "NORMAL",
    status: "CONFIRMED",
    organizerId: "user-1",
    participants: [],
    reminders: [],
    attachments: [],
    ...overrides,
  };
}

describe("getRangeForView", () => {
  it("returns a single day range for the day view", () => {
    const anchor = new Date("2026-02-05T12:00:00.000Z");
    const range = getRangeForView("day", anchor);

    expect(range.from.getDate()).toBe(range.to.getDate());
  });

  it("returns a monday-to-sunday range for the week view", () => {
    const anchor = new Date("2026-02-05T12:00:00.000Z"); // Thursday
    const range = getRangeForView("week", anchor);

    expect(range.from.getDay()).toBe(1);
    expect(range.to.getDay()).toBe(0);
  });
});

describe("shiftAnchor", () => {
  it("moves forward by one day in day mode", () => {
    const anchor = new Date("2026-02-05T12:00:00.000Z");
    const next = shiftAnchor("day", anchor, 1);
    expect(next.getDate()).toBe(6);
  });

  it("moves backward by one week in week mode", () => {
    const anchor = new Date("2026-02-05T12:00:00.000Z");
    const previous = shiftAnchor("week", anchor, -1);
    expect(previous.getDate()).toBe(29);
  });
});

describe("eventsOnDay", () => {
  it("includes events that overlap the given day", () => {
    const event = makeEvent();
    const day = new Date(2026, 1, 2, 0, 0);

    expect(eventsOnDay([event], day)).toHaveLength(1);
  });

  it("excludes events on other days", () => {
    const event = makeEvent();
    const day = new Date(2026, 1, 3, 0, 0);

    expect(eventsOnDay([event], day)).toHaveLength(0);
  });
});

describe("formatEventTime", () => {
  it("formats a timed event as a range", () => {
    expect(formatEventTime(makeEvent())).toBe("09:00 - 10:00");
  });

  it("labels an all-day event", () => {
    expect(formatEventTime(makeEvent({ allDay: true }))).toBe(
      "Toute la journee",
    );
  });
});

describe("event state helpers", () => {
  it("flags a past event", () => {
    const event = makeEvent({
      startAt: "2000-01-01T09:00:00.000Z",
      endAt: "2000-01-01T10:00:00.000Z",
    });
    expect(isPastEvent(event)).toBe(true);
    expect(isOngoingEvent(event)).toBe(false);
  });

  it("flags an ongoing event", () => {
    const now = new Date();
    const event = makeEvent({
      startAt: new Date(now.getTime() - 60_000).toISOString(),
      endAt: new Date(now.getTime() + 60_000).toISOString(),
    });
    expect(isOngoingEvent(event)).toBe(true);
  });

  it("flags an imminent event starting within 15 minutes", () => {
    const now = new Date();
    const event = makeEvent({
      startAt: new Date(now.getTime() + 5 * 60_000).toISOString(),
      endAt: new Date(now.getTime() + 65 * 60_000).toISOString(),
    });
    expect(isImminentEvent(event)).toBe(true);
  });
});
