import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3101";
const ACCESS_TOKEN_COOKIE = "tigilabs_session";
const REFRESH_TOKEN_COOKIE = "tigilabs_refresh";

type BackendError = {
  message?: string | string[];
};

/**
 * The API only ever sees this server's own address, since every request is
 * relayed through this Next.js proxy. Forwarding the client's real address
 * lets the API's per-IP rate limiting (brute-force protection on login and
 * register) key on the actual caller instead of lumping every visitor into
 * one shared bucket.
 */
export function resolveClientIp(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for");
  const firstForwarded = forwarded?.split(",")[0]?.trim();

  return firstForwarded || request.headers.get("x-real-ip") || undefined;
}

export async function forwardAuthRequest(
  path: string,
  body: unknown,
  clientIp?: string,
) {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      body: JSON.stringify(body),
      headers: forwardedHeaders(clientIp),
      method: "POST",
    });
  } catch {
    return NextResponse.json(
      { message: "Le service est momentanement indisponible. Reessayez." },
      { status: 502 },
    );
  }

  const payload = await readJson(response);

  if (!response.ok) {
    return NextResponse.json(
      { message: getErrorMessage(payload) },
      { status: response.status },
    );
  }

  return NextResponse.json(payload);
}

export async function loginWithCookies(body: unknown, clientIp?: string) {
  const response = await fetch(`${API_URL}/auth/login`, {
    body: JSON.stringify(body),
    headers: forwardedHeaders(clientIp),
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

function forwardedHeaders(clientIp?: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(clientIp ? { "x-forwarded-for": clientIp } : {}),
  };
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
