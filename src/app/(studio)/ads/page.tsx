import type { Metadata } from "next";
import Link from "next/link";
import { PlatformTag } from "@/components/status";
import { LoadError, PageHeader } from "@/components/ui";
import { load } from "@/lib/api/server";
import type { AdEntry, ContentItem } from "@/lib/api/types";
import { formatDate, formatRupiah } from "@/lib/format";
import { AdsToolbar } from "./ads-toolbar";

export const metadata: Metadata = { title: "Iklan" };

export default async function AdsPage() {
  const [ads, items] = await Promise.all([load<AdEntry[]>("/ads"), load<ContentItem[]>("/content-items")]);

  if (!ads.ok) {
    return (
      <>
        <PageHeader title="Iklan" />
        <LoadError what="daftar iklan" error={ads.error} />
      </>
    );
  }

  const entries = ads.data ?? [];
  const contentItems = items.ok ? (items.data ?? []) : [];
  const titles = new Map(contentItems.map((item) => [item.id, item.title]));
  const totalSpend = entries.reduce((sum, entry) => sum + Number(entry.spend), 0);
  const syncable = entries.filter((entry) => entry.external_ad_id).length;

  return (
    <>
      <header className="border-b border-rule px-6 pb-5 pt-7 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-3">
              {entries.length} iklan · {formatRupiah(totalSpend)} tercatat
            </div>
            <h1 className="text-[22px] font-semibold tracking-[-0.01em]">Iklan</h1>
          </div>
          <AdsToolbar contentOptions={contentItems.map(({ id, title }) => ({ id, title }))} syncable={syncable} />
        </div>
      </header>

      {!items.ok ? (
        <div className="px-6 pt-4 lg:px-10">
          <p className="font-mono text-[12px] text-amber">Judul konten tidak termuat: {items.error}</p>
        </div>
      ) : null}

      {entries.length === 0 ? (
        <div className="max-w-md px-6 py-16 lg:px-10">
          <p className="font-medium">Belum ada iklan tercatat.</p>
          <p className="mt-1 text-ink-2">
            Setelah memasang iklan di Meta Ads Manager, catat di sini. Isi Meta ad ID supaya performanya bisa di-sync.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left">
            <thead>
              <tr className="border-b border-rule font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3">
                <th className="w-16 py-2.5 pl-6 pr-4 font-normal lg:pl-10">Plat.</th>
                <th className="px-4 py-2.5 font-normal">Konten</th>
                <th className="w-36 px-4 py-2.5 text-right font-normal">Spend</th>
                <th className="w-32 px-4 py-2.5 font-normal">Mulai</th>
                <th className="w-44 py-2.5 pl-4 pr-6 font-normal lg:pr-10">Meta ad ID</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="group relative border-b border-rule hover:bg-panel">
                  <td className="py-3 pl-6 pr-4 lg:pl-10">
                    <PlatformTag platform={entry.platform} />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/ads/${entry.id}`}
                      className="after:absolute after:inset-0 group-hover:underline group-hover:underline-offset-4"
                    >
                      {entry.content_item_id ? (
                        (titles.get(entry.content_item_id) ?? "Konten terhapus")
                      ) : (
                        <span className="text-ink-2">Tanpa konten</span>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[13px]">{formatRupiah(Number(entry.spend))}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-ink-2">{formatDate(entry.started_at)}</td>
                  <td className="py-3 pl-4 pr-6 font-mono text-[12px] lg:pr-10">
                    {entry.external_ad_id ? (
                      <span className="text-ink-2">{entry.external_ad_id}</span>
                    ) : (
                      <span className="text-ink-3">— tidak di-sync</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
