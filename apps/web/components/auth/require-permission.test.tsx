import { render, screen, waitFor } from "@testing-library/react";
import type { User } from "@tigilabs/types";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RequirePermission } from "./require-permission";

const router = vi.hoisted(() => ({
  replace: vi.fn(),
}));

const currentUser = vi.hoisted(() => ({
  isLoading: false,
  user: { permissions: [] } as Partial<User>,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

vi.mock("../../hooks/use-current-user", () => ({
  useCurrentUser: () => currentUser,
}));

describe("RequirePermission", () => {
  afterEach(() => {
    router.replace.mockClear();
  });

  it("renders children when the current user has the required permission", () => {
    currentUser.isLoading = false;
    currentUser.user = { permissions: ["role.manage"] };

    render(
      <RequirePermission permission="role.manage">
        <p>Zone protegee</p>
      </RequirePermission>,
    );

    expect(screen.getByText("Zone protegee")).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("redirects to the dashboard when the permission is missing", async () => {
    currentUser.isLoading = false;
    currentUser.user = { permissions: ["user.read"] };

    render(
      <RequirePermission permission="role.manage">
        <p>Zone protegee</p>
      </RequirePermission>,
    );

    expect(screen.queryByText("Zone protegee")).not.toBeInTheDocument();
    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("renders nothing and does not redirect while the user is loading", () => {
    currentUser.isLoading = true;
    currentUser.user = { permissions: [] };

    render(
      <RequirePermission permission="role.manage">
        <p>Zone protegee</p>
      </RequirePermission>,
    );

    expect(screen.queryByText("Zone protegee")).not.toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
  });
});
