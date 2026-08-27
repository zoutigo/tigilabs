import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3101";
const ACCESS_TOKEN_COOKIE = "tigilabs_session";
const REFRESH_TOKEN_COOKIE = "tigilabs_refresh";

type BackendError = {
  message?: string | string[];
};

export async function forwardAuthRequest(path: string, body: unknown) {
  const response = await fetch(`${API_URL}${path}`, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const payload = await readJson(response);

  if (!response.ok) {
    return NextResponse.json(
      { message: getErrorMessage(payload) },
      { status: response.status },
    );
  }

  return NextResponse.json(payload);
}

export async function loginWithCookies(body: unknown) {
  const response = await fetch(`${API_URL}/auth/login`, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const payload = await readJson(response);

  if (!response.ok) {
    return NextResponse.json(
      { message: getErrorMessage(payload) },
      { status: response.status },
    );
  }

  const cookieStore = cookies();
  const secure = process.env.NODE_ENV === "production";
  cookieStore.set(ACCESS_TOKEN_COOKIE, payload.accessToken, {
    httpOnly: true,
    maxAge: 60 * 60 * 24,
    path: "/",
    sameSite: "lax",
    secure,
  });
  cookieStore.set(REFRESH_TOKEN_COOKIE, payload.refreshToken, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
    sameSite: "lax",
    secure,
  });

  return NextResponse.json({ user: payload.user });
}

export function logoutWithCookies() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", { maxAge: 0, path: "/" });
  response.cookies.set(REFRESH_TOKEN_COOKIE, "", { maxAge: 0, path: "/" });
  return response;
}

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function getErrorMessage(payload: BackendError) {
  if (Array.isArray(payload.message)) {
    return payload.message.join(" ");
  }

  return payload.message ?? "Une erreur est survenue.";
}
