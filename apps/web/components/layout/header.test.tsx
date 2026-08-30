import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Header } from "./header";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

vi.mock("./mobile-menu", () => ({ MobileMenu: () => null }));
vi.mock("./user-menu", () => ({ UserMenu: () => null }));

const notificationsMock = vi.hoisted(() => ({
  notifications: [] as Array<{ id: string }>,
}));

vi.mock("../../hooks/use-unread-notifications", () => ({
  useUnreadNotifications: () => notificationsMock,
}));

describe("Header", () => {
  it("does not show a notification badge when there are no unread notifications", () => {
    notificationsMock.notifications = [];
    render(<Header />);

    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument();
  });

  it("shows the unread notification count as a badge", () => {
    notificationsMock.notifications = [{ id: "n1" }, { id: "n2" }];
    render(<Header />);

    expect(screen.getByText("2")).toBeInTheDocument();
  });
});
