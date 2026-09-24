import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ApiError, request } from "./http";

export type Loaded<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

export async function load<T>(path: string): Promise<Loaded<T>> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) redirect("/login");

  try {
    return { ok: true, data: await request<T>(token, path) };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) redirect("/login");
      return { ok: false, status: error.status, error: error.message };
    }
    return { ok: false, status: 0, error: error instanceof Error ? error.message : "Terjadi kesalahan." };
  }
}
