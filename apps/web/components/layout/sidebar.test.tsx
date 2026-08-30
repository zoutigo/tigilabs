import { render, screen, waitFor } from "@testing-library/react";
import type { User } from "@tigilabs/types";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CurrentUserProvider } from "../providers/current-user-provider";
import { Sidebar } from "./sidebar";

const getCurrentUser = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  usePathname: () => "/tasks",
}));

vi.mock("../../lib/api/auth", () => ({
  getCurrentUser,
}));

const manager: User = {
  email: "manager@tigilabs.com",
  id: "user-manager",
  name: "Responsable Operations",
  permissions: ["task.create", "task.assign"],
  role: "MANAGER",
  roles: ["MANAGER"],
  status: "ACTIVE",
};

describe("Sidebar", () => {
  afterEach(() => {
    getCurrentUser.mockReset();
  });

  it("renders the Tigilabs logo, recommended navigation and active task link", async () => {
    getCurrentUser.mockRejectedValue(new Error("network error"));

    render(
      <CurrentUserProvider>
        <Sidebar />
      </CurrentUserProvider>,
    );

    expect(
      screen.getByLabelText("Tigilabs - tableau de bord"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Tableau de bord/ }),
    ).toHaveAttribute("href", "/dashboard");
    expect(screen.getByText("Taches").closest("a")).toBeNull();
    expect(screen.getByRole("link", { name: /Synthese/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: /Mes taches/ })).toHaveAttribute(
      "href",
      "/tasks/my",
    );
    await waitFor(() => {
      expect(screen.getByText("Admin Tigilabs")).toBeInTheDocument();
    });
  });

  it("shows the users management section to a super admin user", async () => {
    getCurrentUser.mockRejectedValue(new Error("network error"));

    render(
      <CurrentUserProvider>
        <Sidebar />
      </CurrentUserProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("link", { name: /Liste des utilisateurs/ }),
      ).toHaveAttribute("href", "/users");
    });
    expect(
      screen.getByRole("link", { name: /Roles et permissions/ }),
    ).toHaveAttribute("href", "/users/roles");
  });

  it("hides the users management section from a user without the required permissions", async () => {
    getCurrentUser.mockResolvedValue(manager);

    render(
      <CurrentUserProvider>
        <Sidebar />
      </CurrentUserProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Responsable Operations")).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("link", { name: /Liste des utilisateurs/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Roles et permissions/ }),
    ).not.toBeInTheDocument();
  });
});
