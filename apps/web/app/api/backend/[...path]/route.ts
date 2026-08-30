import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3101";

async function proxy(
  request: Request,
  context: { params: { path: string[] } },
) {
  const token = cookies().get("tigilabs_session")?.value;
  const url = new URL(request.url);
  const backendUrl = new URL(`/${context.params.path.join("/")}`, API_URL);
  backendUrl.search = url.search;

  const response = await fetch(backendUrl, {
    body: ["GET", "HEAD"].includes(request.method)
      ? undefined
      : await request.text(),
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": request.headers.get("Content-Type") ?? "application/json",
    },
    method: request.method,
  });
  const payload = await readBody(response);

  return new NextResponse(payload, {
    headers: {
      "Content-Type":
        response.headers.get("Content-Type") ?? "application/json",
    },
    status: response.status,
  });
}

async function readBody(response: Response) {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

export function GET(request: Request, context: { params: { path: string[] } }) {
  return proxy(request, context);
}

export function POST(
  request: Request,
  context: { params: { path: string[] } },
) {
  return proxy(request, context);
}

export function PUT(request: Request, context: { params: { path: string[] } }) {
  return proxy(request, context);
}

export function PATCH(
  request: Request,
  context: { params: { path: string[] } },
) {
  return proxy(request, context);
}

export function DELETE(
  request: Request,
  context: { params: { path: string[] } },
) {
  return proxy(request, context);
}
