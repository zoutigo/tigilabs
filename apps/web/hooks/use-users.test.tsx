import { renderHook, waitFor } from "@testing-library/react";
import type { User } from "@tigilabs/types";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useUsers } from "./use-users";

const apiMocks = vi.hoisted(() => ({
  getUsers: vi.fn(),
}));

vi.mock("../lib/api/users", () => apiMocks);

describe("useUsers", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("starts with an empty list instead of fabricated placeholder users", () => {
    apiMocks.getUsers.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useUsers());

    expect(result.current.users).toEqual([]);
  });

  it("exposes the real users once the API call resolves", async () => {
    const realUsers: User[] = [
      {
        id: "real-user-1",
        name: "Valery M.",
        email: "v@tigilabs.com",
        status: "ACTIVE",
      },
    ];
    apiMocks.getUsers.mockResolvedValue(realUsers);

    const { result } = renderHook(() => useUsers());

    await waitFor(() => expect(result.current.users).toEqual(realUsers));
  });

  it("keeps the list empty instead of falling back to fake user ids when the API call fails", async () => {
    apiMocks.getUsers.mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useUsers());

    await waitFor(() => expect(apiMocks.getUsers).toHaveBeenCalled());
    expect(result.current.users).toEqual([]);
  });
});
