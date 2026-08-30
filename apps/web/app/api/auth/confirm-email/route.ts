import {
  forwardAuthRequest,
  resolveClientIp,
} from "../../../../lib/api/server-auth";

export async function POST(request: Request) {
  return forwardAuthRequest(
    "/auth/confirm-email",
    await request.json(),
    resolveClientIp(request),
  );
}
