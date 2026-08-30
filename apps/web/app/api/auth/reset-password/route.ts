import {
  forwardAuthRequest,
  resolveClientIp,
} from "../../../../lib/api/server-auth";

export async function POST(request: Request) {
  return forwardAuthRequest(
    "/auth/reset-password",
    await request.json(),
    resolveClientIp(request),
  );
}
