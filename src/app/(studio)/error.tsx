"use client";

import { useEffect } from "react";
import { Button, ButtonLink, PageHeader } from "@/components/ui";

export default function StudioError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <PageHeader eyebrow="Error" title="Halaman ini gagal dimuat" />
      <div className="max-w-xl px-6 py-8 lg:px-10">
        <div className="relative border border-rec bg-rec-soft py-3 pl-4 pr-3">
          <span className="absolute inset-y-0 left-0 w-[3px] bg-rec" />
          <p className="font-medium">Terjadi kesalahan yang tidak terduga.</p>
          <p className="mt-1 font-mono text-[12px] text-ink-2">{error.message || "Tanpa pesan error."}</p>
          {error.digest ? <p className="mt-1 font-mono text-[11px] text-ink-3">digest {error.digest}</p> : null}
        </div>
        <div className="mt-5 flex gap-2">
          <Button variant="primary" onClick={() => retry()}>
            Coba lagi
          </Button>
          <ButtonLink href="/" variant="ghost">
            Ke daftar konten
          </ButtonLink>
        </div>
      </div>
    </>
  );
}
