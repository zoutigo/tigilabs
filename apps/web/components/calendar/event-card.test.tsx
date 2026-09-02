import { render, screen } from "@testing-library/react";
import type { CalendarEvent } from "@tigilabs/types";
import { describe, expect, it, vi } from "vitest";
import { EventCard } from "./event-card";

const event: CalendarEvent = {
  id: "event-1",
  title: "Reunion equipe",
  description: null,
  startAt: new Date(2026, 1, 2, 9, 0).toISOString(),
  endAt: new Date(2026, 1, 2, 10, 0).toISOString(),
  allDay: false,
  location: "Bureau Tigilabs",
  privacy: "NORMAL",
  status: "CONFIRMED",
  organizerId: "user-1",
  category: {
    id: "cat-1",
    name: "Reunion interne",
    color: "#2563EB",
    isGlobal: true,
  },
  participants: [
    {
      eventId: "event-1",
      userId: "user-2",
      status: "PENDING",
      user: {
        id: "user-2",
        name: "William",
        email: "william@tigilabs.com",
        status: "ACTIVE",
      },
    },
  ],
  reminders: [],
  attachments: [],
};

describe("EventCard", () => {
  it("renders the title, time and location", () => {
    render(<EventCard event={event} />);

    expect(screen.getByText("Reunion equipe")).toBeInTheDocument();
    expect(screen.getByText("09:00 - 10:00")).toBeInTheDocument();
    expect(screen.getByText("Bureau Tigilabs")).toBeInTheDocument();
    expect(screen.getByText("William")).toBeInTheDocument();
  });

  it("hides location and participants in compact mode", () => {
    render(<EventCard event={event} compact />);

    expect(screen.queryByText("Bureau Tigilabs")).not.toBeInTheDocument();
  });

  it("marks a cancelled event", () => {
    render(<EventCard event={{ ...event, status: "CANCELLED" }} />);

    expect(screen.getByText("Reunion equipe (Annule)")).toBeInTheDocument();
  });

  it("calls onClick with the event", () => {
    const onClick = vi.fn();
    render(<EventCard event={event} onClick={onClick} />);

    screen.getByRole("button").click();

    expect(onClick).toHaveBeenCalledWith(event);
  });
});
