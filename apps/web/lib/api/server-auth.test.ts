import { describe, expect, it } from "vitest";
import { resolveClientIp } from "./server-auth";

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
