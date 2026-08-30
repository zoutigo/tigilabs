type RequestLike = {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
};

/**
 * The API is only ever reached through the Next.js proxy (apps/web), so
 * `req.ip` is the proxy's own address for every request. The proxy forwards
 * the real client address in X-Forwarded-For; without reading it, throttling
 * would key on a single shared bucket and one abusive client could lock out
 * every user.
 */
export function resolveClientIp(request: RequestLike): string {
  const forwarded = request.headers["x-forwarded-for"];
  const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;

  if (forwardedValue) {
    const firstIp = forwardedValue.split(",")[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  return request.ip ?? "unknown";
}
