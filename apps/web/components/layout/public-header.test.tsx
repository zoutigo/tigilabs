import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PublicHeader } from "./public-header";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("PublicHeader", () => {
  it("renders the desktop navigation links", () => {
    render(<PublicHeader />);

    expect(
      screen.getAllByRole("link", { name: "Accueil" })[0],
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "Solutions" })[0],
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "Espace interne" })[0],
    ).toBeInTheDocument();
  });

  it("opens and closes the mobile navigation menu", () => {
    render(<PublicHeader />);

    expect(
      screen.queryByRole("dialog", { hidden: true }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ouvrir le menu" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Fermer le menu" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
