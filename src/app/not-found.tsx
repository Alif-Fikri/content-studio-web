import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass } from "@/components/ui";

export const metadata: Metadata = { title: "Tidak ditemukan" };

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col px-6 py-10 sm:px-12">
      <Link href="/" className="flex items-center gap-2">
        <span className="size-2.5 rounded-full bg-rec" />
        <span className="text-[15px] font-semibold">Content Studio</span>
      </Link>
      <div className="my-auto max-w-md py-16">
        <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3">404 · no signal</div>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.01em]">Halaman tidak ditemukan</h1>
        <p className="mt-1 text-ink-2">Alamat ini tidak ada di dashboard. Mungkin salah ketik, atau link-nya sudah lama.</p>
        <div className="mt-6 flex gap-2">
          <Link href="/" className={buttonClass("primary")}>
            Ke daftar konten
          </Link>
          <Link href="/ads" className={buttonClass("ghost")}>
            Iklan
          </Link>
        </div>
      </div>
    </main>
  );
}
