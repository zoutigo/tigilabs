const API_URL =
  typeof window === "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3101")
    : "/api/backend";

type BackendErrorBody = {
  message?: string | string[];
};

export async function apiClient<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }

  return response.json() as Promise<T>;
}

async function extractErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as BackendErrorBody;
    if (Array.isArray(body.message)) {
      return body.message.join(" ");
    }
    if (body.message) {
      return body.message;
    }
  } catch {
    // Response body was not JSON: fall back to the status below.
  }

  return `API request failed: ${response.status}`;
}
