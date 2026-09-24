"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

const sections = [
  {
    title: "Produksi",
    links: [
      { href: "/", label: "Konten", match: (path: string) => path === "/" || (path.startsWith("/content/") && path !== "/content/new") },
      { href: "/content/new", label: "Upload baru", match: (path: string) => path === "/content/new" },
    ],
  },
  {
    title: "Iklan",
    links: [
      { href: "/ads", label: "Daftar iklan", match: (path: string) => path === "/ads" || /^\/ads\/(?!analytics)[^/]+$/.test(path) },
      { href: "/ads/analytics", label: "Analitik", match: (path: string) => path === "/ads/analytics" },
    ],
  },
];

export function Sidebar({ email }: { email: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <aside className="flex shrink-0 flex-col border-rule bg-ink text-paper md:sticky md:top-0 md:h-dvh md:w-56 md:border-r">
      <div className="flex items-center justify-between gap-3 px-5 py-4 md:block md:py-6">
        <Link href="/" className="block">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-rec" />
            <span className="text-[15px] font-semibold tracking-[-0.01em]">Content Studio</span>
          </div>
          <div className="mt-1 hidden font-mono text-[10px] uppercase tracking-[0.12em] text-paper/45 md:block">
            Produksi konten
          </div>
        </Link>
      </div>

      <nav className="flex gap-6 overflow-x-auto px-5 pb-3 md:block md:flex-1 md:space-y-7 md:overflow-visible md:pb-0">
        {sections.map((section) => (
          <div key={section.title} className="shrink-0">
            <div className="mb-1.5 hidden font-mono text-[10px] uppercase tracking-[0.12em] text-paper/40 md:block">
              {section.title}
            </div>
            <ul className="flex gap-1 md:block md:space-y-px">
              {section.links.map((link) => {
                const active = link.match(pathname);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={`relative block whitespace-nowrap rounded-xs px-2 py-1.5 text-[13px] transition-colors md:-mx-2 ${
                        active ? "bg-paper/10 text-paper" : "text-paper/60 hover:bg-paper/5 hover:text-paper"
                      }`}
                    >
                      {active ? <span className="absolute inset-y-1.5 -left-3 hidden w-[2px] bg-rec md:block" /> : null}
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="hidden border-t border-paper/10 px-5 py-4 md:block">
        <div className="truncate font-mono text-[11px] text-paper/50" title={email ?? undefined}>
          {email ?? "—"}
        </div>
        <button
          type="button"
          onClick={signOut}
          disabled={signingOut}
          className="mt-2 text-[12px] text-paper/70 underline-offset-4 hover:text-paper hover:underline disabled:opacity-50"
        >
          {signingOut ? "Keluar…" : "Keluar"}
        </button>
      </div>
    </aside>
  );
}
