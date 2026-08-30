import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import LoginPage from "./login/page";
import RegisterPage from "./register/page";
import { register as registerAccount } from "../../lib/api/auth";

const replaceMock = vi.fn();
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
    replace: replaceMock,
  }),
  useSearchParams: () => searchParams,
}));

vi.mock("../../lib/api/auth", () => ({
  login: vi.fn(),
  register: vi.fn(),
}));

const registerAccountMock = vi.mocked(registerAccount);

function fillRegisterForm() {
  fireEvent.change(screen.getByLabelText("Nom"), {
    target: { value: "Martin" },
  });
  fireEvent.change(screen.getByLabelText("Prenom"), {
    target: { value: "Alice" },
  });
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "alice@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Mot de passe"), {
    target: { value: "Password123!" },
  });
  fireEvent.change(screen.getByLabelText("Confirmation"), {
    target: { value: "Password123!" },
  });
}

describe("auth pages", () => {
  afterEach(() => {
    vi.clearAllMocks();
    searchParams = new URLSearchParams();
  });

  it("resets the register form and redirects to login after a successful registration", async () => {
    registerAccountMock.mockResolvedValue({
      activationExpiresInHours: 24,
      message: "Compte cree. Confirmez votre adresse email pour l'activer.",
    });

    render(<RegisterPage />);
    fillRegisterForm();
    fireEvent.click(screen.getByRole("button", { name: "Creer mon compte" }));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(
        "/login?registered=1&activationExpiresInHours=24",
      );
    });
    expect(screen.getByLabelText("Email")).toHaveValue("");
    expect(
      screen.queryByText("Inscription impossible."),
    ).not.toBeInTheDocument();
  });

  it("keeps the register form visible and displays the API error when registration fails", async () => {
    registerAccountMock.mockRejectedValue(
      new Error("Cette adresse email est deja inscrite."),
    );

    render(<RegisterPage />);
    fillRegisterForm();
    fireEvent.click(screen.getByRole("button", { name: "Creer mon compte" }));

    expect(
      await screen.findByText("Cette adresse email est deja inscrite."),
    ).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
    expect(
      screen.getByRole("heading", { name: "Inscription" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveValue("alice@example.com");
  });

  it("shows the registration success message on login with the activation delay", () => {
    searchParams = new URLSearchParams({
      activationExpiresInHours: "24",
      registered: "1",
    });

    render(<LoginPage />);

    expect(screen.getByText("Compte cree avec succes.")).toBeInTheDocument();
    expect(
      screen.getByText(/Un email a ete envoye dans votre boite mail/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Le lien d'activation est valable 24 heures./),
    ).toBeInTheDocument();
  });

  it("does not show the registration success message on login by default", () => {
    render(<LoginPage />);

    expect(
      screen.queryByText("Compte cree avec succes."),
    ).not.toBeInTheDocument();
  });
});
