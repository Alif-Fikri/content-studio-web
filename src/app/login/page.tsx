import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk" };

const steps = [
  ["01", "Upload rekaman layar", "mp4 mentah, maks. 2 menit"],
  ["02", "Tulis caption & script", "draft dari AI, kamu yang edit"],
  ["03", "Render", "overlay teks dibakar ke video"],
  ["04", "Posting", "download, unggah manual"],
];

function safeNext(value: string | string[] | undefined): string {
  const next = Array.isArray(value) ? value[0] : value;
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const today = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date());

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-ink p-10 text-paper lg:flex">
        <div className="grid grid-cols-3 border border-paper/25 font-mono text-[11px] uppercase tracking-[0.1em]">
          {[
            ["Prod", "Content Studio"],
            ["Take", "—"],
            ["Tgl", today],
          ].map(([label, value]) => (
            <div key={label} className="border-r border-paper/25 px-3 py-2.5 last:border-r-0">
              <div className="text-paper/45">{label}</div>
              <div className="mt-1 truncate text-paper">{value}</div>
            </div>
          ))}
        </div>

        <div>
          <p className="max-w-[26ch] text-[34px] font-medium leading-[1.12] tracking-[-0.02em]">
            Dari rekaman layar sampai siap posting.
          </p>
          <ol className="mt-10 max-w-md border-t border-paper/20">
            {steps.map(([n, title, sub]) => (
              <li key={n} className="grid grid-cols-[3rem_1fr] items-baseline border-b border-paper/20 py-3">
                <span className="font-mono text-[12px] text-rec">{n}</span>
                <span>
                  <span className="text-[14px]">{title}</span>
                  <span className="ml-2 text-[13px] text-paper/45">{sub}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] text-paper/45">
          <span className="size-2 animate-blink rounded-full bg-rec" />
          Standby
        </div>
      </div>

      <div className="flex flex-col justify-center px-6 py-16 sm:px-12">
        <div className="mx-auto w-full max-w-[340px]">
          <div className="mb-10 flex items-center gap-2 lg:hidden">
            <span className="size-2.5 rounded-full bg-rec" />
            <span className="text-[15px] font-semibold">Content Studio</span>
          </div>
          <h1 className="text-[22px] font-semibold tracking-[-0.01em]">Masuk</h1>
          <p className="mt-1 text-[13px] text-ink-2">Dashboard pribadi. Tidak ada pendaftaran akun.</p>
          <LoginForm next={safeNext(next)} />
        </div>
      </div>
    </div>
  );
}
