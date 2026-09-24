import { env } from "@/lib/env";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function request<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${env.apiBaseUrl}${path}`, { ...init, headers, cache: "no-store" });
  } catch {
    throw new ApiError(0, `Tidak bisa menghubungi API di ${env.apiBaseUrl}. Pastikan backend berjalan dan CORS mengizinkan origin ini.`);
  }

  const text = await response.text();

  if (!response.ok) {
    throw new ApiError(response.status, readError(text) ?? `${response.status} ${response.statusText}`);
  }

  return (text ? JSON.parse(text) : undefined) as T;
}

function readError(text: string): string | null {
  try {
    const body = JSON.parse(text);
    return typeof body?.error === "string" ? body.error : null;
  } catch {
    return text.trim() || null;
  }
}
