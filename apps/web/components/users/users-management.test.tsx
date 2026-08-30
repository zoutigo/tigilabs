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
    firstName: "Serge",
    id: "user-manager",
    lastName: "Biya",
    name: "Serge Biya",
    role: "MANAGER",
    roles: ["MANAGER"],
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
});
