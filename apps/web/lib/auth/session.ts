import { cookies } from "next/headers";

export async function getSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get("tigilabs_session")?.value ?? null;
}
