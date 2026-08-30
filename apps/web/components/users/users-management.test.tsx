import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Role, User } from "@tigilabs/types";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../ui/toast";
import { UsersManagement } from "./users-management";

const apiMocks = vi.hoisted(() => ({
  updateUser: vi.fn(),
}));

const users: User[] = [
  {
    email: "valery@tigilabs.com",
    emailVerifiedAt: "2026-01-01T00:00:00.000Z",
    firstName: "Valery",
    id: "user-admin",
    lastName: "Mbenda",
    name: "Valery Mbenda",
    role: "ADMIN",
    roles: ["ADMIN"],
    status: "ACTIVE",
  },
  {
    email: "serge@tigilabs.com",
    emailVerifiedAt: "2026-01-02T00:00:00.000Z",
    firstName: "Serge",
    id: "user-manager",
    lastName: "Biya",
    name: "Serge Biya",
    role: "MANAGER",
    roles: ["MANAGER"],
    status: "INVITED",
  },
  {
    email: "nadia@tigilabs.com",
    emailVerifiedAt: null,
    firstName: "Nadia",
    id: "user-pending-email",
    lastName: "Kone",
    name: "Nadia Kone",
    role: undefined,
    roles: [],
    status: "INVITED",
  },
];

const roles: Role[] = [
  { id: "role-admin", name: "ADMIN" },
  { id: "role-manager", name: "MANAGER" },
];

vi.mock("../../hooks/use-users", () => ({
  useRoles: () => ({ roles }),
  useUsers: () => ({ users }),
}));

vi.mock("../../lib/api/users", () => apiMocks);

function renderManagement() {
  return render(
    <ToastProvider>
      <UsersManagement />
    </ToastProvider>,
  );
}

describe("UsersManagement", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("lists users with their name, first name, email and status", () => {
    renderManagement();

    expect(screen.getByText("Mbenda")).toBeInTheDocument();
    expect(screen.getByText("Valery")).toBeInTheDocument();
    expect(screen.getByText("valery@tigilabs.com")).toBeInTheDocument();
    expect(screen.getByLabelText("Statut de Valery Mbenda")).toHaveValue(
      "ACTIVE",
    );
    expect(screen.getByText("Biya")).toBeInTheDocument();
  });

  it("does not render a user creation form", () => {
    renderManagement();

    expect(screen.queryByText("Nouvel utilisateur")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Creer/i }),
    ).not.toBeInTheDocument();
  });

  it("updates the role of a user and shows a success toast", async () => {
    apiMocks.updateUser.mockResolvedValue({});
    renderManagement();

    fireEvent.change(screen.getByLabelText("Role de Valery Mbenda"), {
      target: { value: "MANAGER" },
    });

    await waitFor(() => {
      expect(apiMocks.updateUser).toHaveBeenCalledWith("user-admin", {
        roles: ["MANAGER"],
      });
    });
    expect(
      await screen.findByText("Role de Valery Mbenda mis a jour."),
    ).toBeInTheDocument();
  });

  it("reverts the status change and shows an error toast on failure", async () => {
    apiMocks.updateUser.mockRejectedValue(new Error("Statut invalide."));
    renderManagement();

    const select = screen.getByLabelText(
      "Statut de Serge Biya",
    ) as HTMLSelectElement;

    fireEvent.change(select, { target: { value: "DISABLED" } });

    await waitFor(() => {
      expect(apiMocks.updateUser).toHaveBeenCalledWith("user-manager", {
        status: "DISABLED",
      });
    });
    expect(
      await screen.findByText("La mise a jour du statut a echoue."),
    ).toBeInTheDocument();
    expect(screen.getByText("Statut invalide.")).toBeInTheDocument();
    await waitFor(() => {
      expect(select.value).toBe("INVITED");
    });
  });

  it("shows the validation state of each account", () => {
    renderManagement();

    expect(screen.getByText("Compte valide")).toBeInTheDocument();
    expect(screen.getByText("En attente de validation")).toBeInTheDocument();
    expect(screen.getByText("Email non confirme")).toBeInTheDocument();
  });

  it("lets an admin approve a user whose email is confirmed", async () => {
    apiMocks.updateUser.mockResolvedValue({});
    renderManagement();

    fireEvent.click(screen.getByRole("button", { name: "Valider" }));

    await waitFor(() => {
      expect(apiMocks.updateUser).toHaveBeenCalledWith("user-manager", {
        status: "ACTIVE",
      });
    });
    expect(
      await screen.findByText("Serge Biya peut maintenant se connecter."),
    ).toBeInTheDocument();
  });

  it("does not offer to approve a user whose email is not confirmed", () => {
    renderManagement();

    const buttons = screen.getAllByRole("button", { name: "Valider" });
    expect(buttons).toHaveLength(1);
  });

  it("reverts the approval and shows an error toast on failure", async () => {
    apiMocks.updateUser.mockRejectedValue(new Error("Validation impossible."));
    renderManagement();

    fireEvent.click(screen.getByRole("button", { name: "Valider" }));

    expect(
      await screen.findByText("La validation du compte a echoue."),
    ).toBeInTheDocument();
    expect(screen.getByText("Validation impossible.")).toBeInTheDocument();
    expect(screen.getByText("En attente de validation")).toBeInTheDocument();
  });
});
