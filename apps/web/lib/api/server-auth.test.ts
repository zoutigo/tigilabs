import { afterEach, describe, expect, it, vi } from "vitest";
import { forwardAuthRequest, resolveClientIp } from "./server-auth";

describe("resolveClientIp", () => {
  it("reads the first address from X-Forwarded-For", () => {
    const request = new Request("http://localhost/api/auth/login", {
      headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" },
    });

    expect(resolveClientIp(request)).toBe("203.0.113.7");
  });

  it("falls back to X-Real-Ip when there is no X-Forwarded-For header", () => {
    const request = new Request("http://localhost/api/auth/login", {
      headers: { "x-real-ip": "198.51.100.4" },
    });

    expect(resolveClientIp(request)).toBe("198.51.100.4");
  });

  it("returns undefined when no client address header is present", () => {
    const request = new Request("http://localhost/api/auth/login");

    expect(resolveClientIp(request)).toBeUndefined();
  });
});

describe("forwardAuthRequest", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the backend payload as JSON when the request succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "ok" }), {
          status: 201,
        }),
      ),
    );

    const response = await forwardAuthRequest("/auth/register", {
      email: "a@b.com",
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ message: "ok" });
  });

  it("forwards a friendly message when the backend returns an error body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "Email deja utilise" }), {
          status: 409,
        }),
      ),
    );

    const response = await forwardAuthRequest("/auth/register", {});

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      message: "Email deja utilise",
    });
  });

  it("returns a 502 with a readable message when the backend is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("fetch failed")),
    );

    const response = await forwardAuthRequest("/auth/register", {});

    expect(response.status).toBe(502);
    const body = await response.json();
    expect(typeof body.message).toBe("string");
    expect(body.message.length).toBeGreaterThan(0);
  });

  it("does not throw when the backend responds with an empty body on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("", { status: 200 })),
    );

    const response = await forwardAuthRequest("/auth/register", {});

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({});
  });
});
