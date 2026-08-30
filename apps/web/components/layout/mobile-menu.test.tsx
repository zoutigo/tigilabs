import { fireEvent, render, screen } from "@testing-library/react";
import type { User } from "@tigilabs/types";
import { describe, expect, it, vi } from "vitest";
import { MobileMenu } from "./mobile-menu";

const currentUser = vi.hoisted(() => ({
  isLoading: false,
  refresh: vi.fn(),
  setUser: vi.fn(),
  user: {} as Partial<User>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("../../hooks/use-current-user", () => ({
  useCurrentUser: () => currentUser,
}));

const admin: Partial<User> = {
  name: "Admin Tigilabs",
  permissions: ["user.manage", "role.manage"],
};

const member: Partial<User> = {
  name: "Equipe Produit",
  permissions: ["user.read"],
};

function openMenu() {
  fireEvent.click(screen.getByLabelText("Ouvrir le menu"));
}

describe("MobileMenu", () => {
  it("shows the users management links for a super admin user", () => {
    currentUser.user = admin;
    render(<MobileMenu />);

    openMenu();

    expect(
      screen.getByRole("link", { name: /Liste des utilisateurs/ }),
    ).toHaveAttribute("href", "/users");
    expect(
      screen.getByRole("link", { name: /Roles et permissions/ }),
    ).toHaveAttribute("href", "/users/roles");
  });

  it("hides the users management links for a user without the required permissions", () => {
    currentUser.user = member;
    render(<MobileMenu />);

    openMenu();

    expect(
      screen.queryByRole("link", { name: /Liste des utilisateurs/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Roles et permissions/ }),
    ).not.toBeInTheDocument();
  });
});
