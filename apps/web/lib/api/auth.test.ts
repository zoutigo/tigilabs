import { afterEach, describe, expect, it, vi } from "vitest";
import { register } from "./auth";

describe("register", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the parsed payload on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ activationExpiresInHours: 24, message: "ok" }),
            { status: 201 },
          ),
        ),
    );

    await expect(
      register({
        email: "alice@example.com",
        firstName: "Alice",
        lastName: "Martin",
        password: "Password123!",
        passwordConfirm: "Password123!",
      }),
    ).resolves.toEqual({ activationExpiresInHours: 24, message: "ok" });
  });

  it("throws the backend message when the request fails with a JSON body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "Email deja inscrit" }), {
          status: 409,
        }),
      ),
    );

    await expect(
      register({
        email: "alice@example.com",
        firstName: "Alice",
        lastName: "Martin",
        password: "Password123!",
        passwordConfirm: "Password123!",
      }),
    ).rejects.toThrow("Email deja inscrit");
  });

  it("throws a readable message instead of a JSON parse error on an empty response body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("", { status: 200 })),
    );

    await expect(
      register({
        email: "alice@example.com",
        firstName: "Alice",
        lastName: "Martin",
        password: "Password123!",
        passwordConfirm: "Password123!",
      }),
    ).rejects.toThrow(/reponse invalide/i);
  });

  it("throws a readable message when the network request itself fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    await expect(
      register({
        email: "alice@example.com",
        firstName: "Alice",
        lastName: "Martin",
        password: "Password123!",
        passwordConfirm: "Password123!",
      }),
    ).rejects.toThrow(/impossible de contacter/i);
  });
});
