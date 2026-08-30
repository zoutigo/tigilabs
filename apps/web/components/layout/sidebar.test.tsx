import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Sidebar } from "./sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/tasks",
}));

describe("Sidebar", () => {
  it("renders the Tigilabs logo, recommended navigation and active task link", () => {
    render(<Sidebar />);

    expect(
      screen.getByLabelText("Tigilabs - tableau de bord"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Tableau de bord/ }),
    ).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: /Taches/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: /Mes taches/ })).toHaveAttribute(
      "href",
      "/tasks/my",
    );
    expect(screen.getByText("Valery M.")).toBeInTheDocument();
  });
});
