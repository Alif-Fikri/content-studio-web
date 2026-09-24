import { createClient } from "@/lib/supabase/browser";
import { ApiError, request } from "./http";

const expired = "Sesi berakhir. Mengarahkan ke halaman masuk…";

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

function unauthorized(): never {
  unauthorizedHandler?.();
  throw new ApiError(401, expired);
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const { data } = await createClient().auth.getSession();
  const token = data.session?.access_token;
  if (!token) unauthorized();

  try {
    return await request<T>(token, path, init);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) unauthorized();
    throw error;
  }
}

export function post<T>(path: string, body?: unknown): Promise<T> {
  return api<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Terjadi kesalahan yang tidak diketahui.";
}
