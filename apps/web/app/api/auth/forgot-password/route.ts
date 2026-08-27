import { forwardAuthRequest } from "../../../../lib/api/server-auth";

export async function POST(request: Request) {
  return forwardAuthRequest("/auth/forgot-password", await request.json());
}
