import { resolveClientIp } from "./resolve-client-ip";

describe("resolveClientIp", () => {
  it("uses the first address in X-Forwarded-For, set by the Next.js proxy", () => {
    expect(
      resolveClientIp({
        headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" },
        ip: "10.0.0.1",
      }),
    ).toBe("203.0.113.7");
  });

  it("trims whitespace around the forwarded address", () => {
    expect(
      resolveClientIp({
        headers: { "x-forwarded-for": "  203.0.113.7  ,10.0.0.1" },
      }),
    ).toBe("203.0.113.7");
  });

  it("handles X-Forwarded-For sent as an array of header values", () => {
    expect(
      resolveClientIp({
        headers: { "x-forwarded-for": ["203.0.113.7", "10.0.0.1"] },
      }),
    ).toBe("203.0.113.7");
  });

  it("falls back to the socket address when no header is present", () => {
    expect(resolveClientIp({ headers: {}, ip: "127.0.0.1" })).toBe("127.0.0.1");
  });

  it("falls back to 'unknown' when neither the header nor the socket address is available", () => {
    expect(resolveClientIp({ headers: {} })).toBe("unknown");
  });
});
