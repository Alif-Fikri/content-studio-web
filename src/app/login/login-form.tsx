"use client";

import { useRouter } from "next/navigation";
import { useState, type SubmitEvent } from "react";
import { Button, inputClass, Label, Spinner } from "@/components/ui";
import { createClient } from "@/lib/supabase/browser";

function translate(message: string): string {
  if (/invalid login credentials/i.test(message)) return "Email atau password salah.";
  if (/email not confirmed/i.test(message)) return "Email belum dikonfirmasi di Supabase.";
  if (/rate limit|too many/i.test(message)) return "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.";
  if (/fetch|network/i.test(message)) return "Tidak bisa menghubungi Supabase. Cek koneksi atau NEXT_PUBLIC_SUPABASE_URL.";
  return message;
}

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);

    const { error } = await createClient().auth.signInWithPassword({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });

    if (error) {
      setError(translate(error.message));
      setPending(false);
      return;
    }

    router.replace(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <input id="email" name="email" type="email" autoComplete="email" required autoFocus className={inputClass} />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </div>

      {error ? (
        <p role="alert" className="border-l-2 border-rec bg-rec-soft px-3 py-2 text-[13px] text-ink">
          {error}
        </p>
      ) : null}

      <Button type="submit" variant="primary" disabled={pending} className="h-9 w-full">
        {pending ? <Spinner /> : null}
        {pending ? "Memeriksa…" : "Masuk"}
      </Button>
    </form>
  );
}
