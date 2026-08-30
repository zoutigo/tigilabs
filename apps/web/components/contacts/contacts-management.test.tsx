import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ContactMessage } from "@tigilabs/types";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../ui/toast";
import { ContactsManagement } from "./contacts-management";

const apiMocks = vi.hoisted(() => ({
  updateContactMessageStatus: vi.fn(),
}));

const messages: ContactMessage[] = [
  {
    id: "msg-1",
    name: "Ada Lovelace",
    email: "ada@example.com",
    subject: "Projet ecole",
    message: "Bonjour, je souhaite un devis pour Scolive.",
    status: "NEW",
    createdAt: "2026-01-05T10:00:00.000Z",
  },
  {
    id: "msg-2",
    name: "Grace Hopper",
    email: "grace@example.com",
    message: "Interessee par une demonstration.",
    status: "READ",
    createdAt: "2026-01-04T10:00:00.000Z",
  },
];

vi.mock("../../hooks/use-contact-messages", () => ({
  useContactMessages: () => ({ messages }),
}));

vi.mock("../../lib/api/contact", () => apiMocks);

function renderManagement() {
  return render(
    <ToastProvider>
      <ContactsManagement />
    </ToastProvider>,
  );
}

describe("ContactsManagement", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("lists contact messages with name, email and status", () => {
    renderManagement();

    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    expect(screen.getByText("Nouveau")).toBeInTheDocument();
    expect(screen.getByText("Lu")).toBeInTheDocument();
  });

  it("marks a new message as read and shows a success toast", async () => {
    apiMocks.updateContactMessageStatus.mockResolvedValue({});
    renderManagement();

    fireEvent.click(screen.getByRole("button", { name: /Marquer lu/i }));

    await waitFor(() => {
      expect(apiMocks.updateContactMessageStatus).toHaveBeenCalledWith(
        "msg-1",
        "READ",
      );
    });
    expect(
      await screen.findByText("Message de Ada Lovelace marque comme lu."),
    ).toBeInTheDocument();
  });

  it("archives a message", async () => {
    apiMocks.updateContactMessageStatus.mockResolvedValue({});
    renderManagement();

    const archiveButtons = screen.getAllByRole("button", {
      name: /Archiver/i,
    });
    fireEvent.click(archiveButtons[0]);

    await waitFor(() => {
      expect(apiMocks.updateContactMessageStatus).toHaveBeenCalledWith(
        "msg-1",
        "ARCHIVED",
      );
    });
  });

  it("reverts the status and shows an error toast on failure", async () => {
    apiMocks.updateContactMessageStatus.mockRejectedValue(
      new Error("Mise a jour impossible."),
    );
    renderManagement();

    fireEvent.click(screen.getByRole("button", { name: /Marquer lu/i }));

    expect(
      await screen.findByText("La mise a jour du message a echoue."),
    ).toBeInTheDocument();
    expect(screen.getByText("Mise a jour impossible.")).toBeInTheDocument();
    expect(screen.getByText("Nouveau")).toBeInTheDocument();
  });
});
