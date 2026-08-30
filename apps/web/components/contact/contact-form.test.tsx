import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../ui/toast";
import { ContactForm } from "./contact-form";

const apiMocks = vi.hoisted(() => ({
  submitContactMessage: vi.fn(),
}));

vi.mock("../../lib/api/contact", () => apiMocks);

function renderForm() {
  return render(
    <ToastProvider>
      <ContactForm />
    </ToastProvider>,
  );
}

function fillValidForm() {
  fireEvent.input(screen.getByLabelText("Nom"), {
    target: { value: "Ada Lovelace" },
  });
  fireEvent.input(screen.getByLabelText("Email"), {
    target: { value: "ada@example.com" },
  });
  fireEvent.input(screen.getByPlaceholderText("Decrivez votre besoin"), {
    target: { value: "Bonjour, je souhaite discuter d'un projet Scolive." },
  });
}

describe("ContactForm", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("submits a valid message and shows a success toast", async () => {
    apiMocks.submitContactMessage.mockResolvedValue({ message: "ok" });
    renderForm();

    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /Envoyer/i }));

    await waitFor(() => {
      expect(apiMocks.submitContactMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Ada Lovelace",
          email: "ada@example.com",
        }),
      );
    });
    expect(await screen.findByText("Message envoye")).toBeInTheDocument();
  });

  it("includes the honeypot and timing fields in the payload", async () => {
    apiMocks.submitContactMessage.mockResolvedValue({ message: "ok" });
    renderForm();

    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /Envoyer/i }));

    await waitFor(() => {
      expect(apiMocks.submitContactMessage).toHaveBeenCalledWith(
        expect.objectContaining({ website: "", startedAt: expect.any(String) }),
      );
    });
  });

  it("shows validation errors and does not submit when fields are invalid", async () => {
    renderForm();

    fireEvent.input(screen.getByLabelText("Email"), {
      target: { value: "not-an-email" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Envoyer/i }));

    expect(await screen.findByText("Email invalide.")).toBeInTheDocument();
    expect(apiMocks.submitContactMessage).not.toHaveBeenCalled();
  });

  it("shows a form error message when the submission fails", async () => {
    apiMocks.submitContactMessage.mockRejectedValue(
      new Error("Trop de requetes, reessayez plus tard."),
    );
    renderForm();

    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /Envoyer/i }));

    expect(
      await screen.findByText("Trop de requetes, reessayez plus tard."),
    ).toBeInTheDocument();
  });
});
