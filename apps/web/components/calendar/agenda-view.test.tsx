import { render, screen } from "@testing-library/react";
import type { CalendarEvent } from "@tigilabs/types";
import { describe, expect, it, vi } from "vitest";
import { AgendaView, isEventVisible } from "./agenda-view";

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: "event-1",
    title: "Reunion equipe",
    description: null,
    startAt: new Date(Date.now() + 60 * 60_000).toISOString(),
    endAt: new Date(Date.now() + 2 * 60 * 60_000).toISOString(),
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

describe("AgendaView", () => {
  it("shows an empty state with a call to action when there are no events", () => {
    const onCreate = vi.fn();
    render(<AgendaView events={[]} onSelect={vi.fn()} onCreate={onCreate} />);

    expect(screen.getByText("Aucun rendez-vous a venir")).toBeInTheDocument();
    screen.getByRole("button", { name: /planifier un rendez-vous/i }).click();
    expect(onCreate).toHaveBeenCalled();
  });

  it("groups upcoming events under Aujourd'hui", () => {
    render(
      <AgendaView
        events={[makeEvent()]}
        onSelect={vi.fn()}
        onCreate={vi.fn()}
      />,
    );

    expect(screen.getByText("Aujourd'hui")).toBeInTheDocument();
    expect(screen.getByText("Reunion equipe")).toBeInTheDocument();
  });

  it("excludes events that already ended", () => {
    render(
      <AgendaView
        events={[
          makeEvent({
            startAt: "2000-01-01T09:00:00.000Z",
            endAt: "2000-01-01T10:00:00.000Z",
          }),
        ]}
        onSelect={vi.fn()}
        onCreate={vi.fn()}
      />,
    );

    expect(screen.getByText("Aucun rendez-vous a venir")).toBeInTheDocument();
  });
});

describe("isEventVisible", () => {
  const event = makeEvent({ title: "Presentation Scolive", location: "Ecole" });

  it("matches on title, location or participant", () => {
    expect(isEventVisible(event, "scolive", null)).toBe(true);
    expect(isEventVisible(event, "ecole", null)).toBe(true);
    expect(isEventVisible(event, "introuvable", null)).toBe(false);
  });

  it("filters by category id", () => {
    const categorized = { ...event, categoryId: "cat-1" };
    expect(isEventVisible(categorized, "", "cat-1")).toBe(true);
    expect(isEventVisible(categorized, "", "cat-2")).toBe(false);
  });
});
