"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Notice, Spinner } from "@/components/ui";
import { ApiError } from "@/lib/api/http";
import { errorMessage, post } from "@/lib/api/browser";

export function SyncButton({ appId }: { appId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  async function sync() {
    setPending(true);
    setMessage(null);
    try {
      await post(`/apps/${appId}/metrics/sync`);
      setMessage({ tone: "ok", text: "Metrik terbaru sudah ditarik dari Google Play." });
      router.refresh();
    } catch (error) {
      const text =
        error instanceof ApiError && error.status === 503
          ? "Integrasi Google Play belum dikonfigurasi di backend."
          : errorMessage(error);
      setMessage({ tone: "error", text });
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <Button onClick={sync} disabled={pending}>
        {pending ? <Spinner /> : null}
        {pending ? "Menyinkron…" : "Sync metrik"}
      </Button>
      {message ? (
        <div className="mt-3">
          <Notice tone={message.tone} title={message.tone === "error" ? "Sync gagal" : "Sync selesai"}>
            {message.text}
          </Notice>
        </div>
      ) : null}
    </div>
  );
}
