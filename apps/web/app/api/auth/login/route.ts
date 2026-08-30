import {
  loginWithCookies,
  resolveClientIp,
} from "../../../../lib/api/server-auth";

export async function POST(request: Request) {
  return loginWithCookies(await request.json(), resolveClientIp(request));
}
