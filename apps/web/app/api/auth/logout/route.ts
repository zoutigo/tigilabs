import { logoutWithCookies } from "../../../../lib/api/server-auth";

export function POST() {
  return logoutWithCookies();
}
