"use client";

import { useRouter } from "next/navigation";
import { useState, type SubmitEvent } from "react";
import { Button, inputClass, Label, Notice, Spinner } from "@/components/ui";
import { errorMessage, post } from "@/lib/api/browser";

export function RegisterAppForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const consoleUrl = String(form.get("play_console_url") ?? "").trim();
    setPending(true);
    setError(null);
    try {
      await post("/apps", {
        name: String(form.get("name") ?? "").trim(),
        package_name: String(form.get("package_name") ?? "").trim(),
        play_console_url: consoleUrl || null,
      });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
      setPending(false);
    }
  }

  if (!open) {
    return (
      <Button variant="primary" onClick={() => setOpen(true)}>
        Daftarkan app
      </Button>
    );
  }

  return (
    <div className="basis-full border border-rule-strong bg-panel p-5">
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1.4fr)]">
        <div>
          <Label htmlFor="name">Nama app</Label>
          <input id="name" name="name" required placeholder="Beres" className={inputClass} />
        </div>
        <div>
          <Label htmlFor="package_name">Package name</Label>
          <input id="package_name" name="package_name" required placeholder="com.suiten.beres" className={`${inputClass} font-mono`} />
        </div>
        <div>
          <Label htmlFor="play_console_url" hint="opsional">
            Link Play Console
          </Label>
          <input id="play_console_url" name="play_console_url" placeholder="https://play.google.com/console/…" className={inputClass} />
        </div>

        {error ? (
          <div className="sm:col-span-3">
            <Notice tone="error" title="Gagal mendaftarkan app">
              {error}
            </Notice>
          </div>
        ) : null}

        <div className="flex items-center gap-2 sm:col-span-3">
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? <Spinner /> : null}
            Simpan
          </Button>
          <Button variant="ghost" disabled={pending} onClick={() => setOpen(false)}>
            Batal
          </Button>
        </div>
      </form>
    </div>
  );
}
