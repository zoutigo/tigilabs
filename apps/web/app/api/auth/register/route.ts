import { forwardAuthRequest } from "../../../../lib/api/server-auth";

export async function POST(request: Request) {
  return forwardAuthRequest("/auth/register", await request.json());
}
