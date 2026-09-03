import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { User } from "@tigilabs/types";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../ui/toast";
import { CalendarPage } from "./calendar-page";

const admin: User = {
  id: "user-admin",
  name: "Valery M.",
  email: "valery@tigilabs.com",
  status: "ACTIVE",
};

const apiMocks = vi.hoisted(() => ({
  createEvent: vi.fn(),
  deleteEvent: vi.fn(),
  respondToEvent: vi.fn(),
  updateEvent: vi.fn(),
}));

vi.mock("../../hooks/use-current-user", () => ({
  useCurrentUser: () => ({ user: admin }),
}));

vi.mock("../../hooks/use-calendar", () => ({
  useCalendarCategories: () => ({ categories: [] }),
  useCalendarEvents: () => ({
    events: [],
    loading: false,
    refetch: vi.fn(),
  }),
}));

vi.mock("../../hooks/use-users", () => ({
  useUsers: () => ({ users: [admin] }),
}));

vi.mock("../../lib/api/calendar", () => apiMocks);

function renderCalendarPage() {
  return render(
    <ToastProvider>
      <CalendarPage />
    </ToastProvider>,
  );
}

async function openCreateFormAndFillTitle() {
  fireEvent.click(screen.getByRole("button", { name: /Nouveau rendez-vous/i }));

  fireEvent.change(
    await screen.findByPlaceholderText("Reunion preparation deploiement"),
    { target: { value: "Point client" } },
  );
}

describe("CalendarPage event creation errors", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows the backend's explicit error message when creation is rejected (e.g. missing RBAC permission)", async () => {
    apiMocks.createEvent.mockRejectedValue(
      new Error("Permission manquante: calendar.event.create"),
    );

    renderCalendarPage();
    await openCreateFormAndFillTitle();
    fireEvent.click(screen.getByRole("button", { name: "Creer" }));

    expect(await screen.findByText("Creation impossible")).toBeInTheDocument();
    expect(
      await screen.findByText("Permission manquante: calendar.event.create"),
    ).toBeInTheDocument();
  });

  it("falls back to a generic description when the API rejects without an Error instance", async () => {
    apiMocks.createEvent.mockRejectedValue("network down");

    renderCalendarPage();
    await openCreateFormAndFillTitle();
    fireEvent.click(screen.getByRole("button", { name: "Creer" }));

    expect(await screen.findByText("Creation impossible")).toBeInTheDocument();
    expect(
      await screen.findByText("Reessayez dans quelques instants."),
    ).toBeInTheDocument();
  });

  it("closes the form and refetches events when creation succeeds", async () => {
    apiMocks.createEvent.mockResolvedValue({ id: "event-new" });

    renderCalendarPage();
    await openCreateFormAndFillTitle();
    fireEvent.click(screen.getByRole("button", { name: "Creer" }));

    await waitFor(() => expect(apiMocks.createEvent).toHaveBeenCalled());
    expect(await screen.findByText("Evenement cree")).toBeInTheDocument();
  });
});
