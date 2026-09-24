import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { DailyTable, SpendClicksCharts, TotalsRow } from "@/components/metrics-view";
import { PlatformTag } from "@/components/status";
import { buttonClass, inputClass, LoadError, PageHeader, Section } from "@/components/ui";
import { load } from "@/lib/api/server";
import type { AdEntry, AdMetric, ContentItem } from "@/lib/api/types";
import { formatDate, formatInt, formatPercent, formatRupiah } from "@/lib/format";
import { byDay, inRange, totals, type Totals } from "@/lib/metrics";
import { presets, resolveRange } from "@/lib/range";

export const metadata: Metadata = { title: "Analitik iklan" };

type Group = { key: string; label: ReactNode; href?: string; ads: number; totals: Totals };

export default async function AnalyticsPage({ searchParams }: PageProps<"/ads/analytics">) {
  const range = resolveRange(await searchParams);
  const [ads, items] = await Promise.all([load<AdEntry[]>("/ads"), load<ContentItem[]>("/content-items")]);

  if (!ads.ok) {
    return (
      <>
        <PageHeader eyebrow="Iklan" title="Analitik" />
        <LoadError what="iklan" error={ads.error} />
      </>
    );
  }

  const entries = ads.data ?? [];
  const metricResults = await Promise.all(entries.map((entry) => load<AdMetric[]>(`/ads/${entry.id}/metrics`)));
  const failedLoads = metricResults.filter((result) => !result.ok).length;
  const metricsByAd = new Map(
    entries.map((entry, index) => {
      const result = metricResults[index];
      return [entry.id, inRange(result.ok ? (result.data ?? []) : [], range.from, range.to)];
    }),
  );
  const all = [...metricsByAd.values()].flat();
  const rows = byDay(all);
  const titles = new Map((items.ok ? (items.data ?? []) : []).map((item) => [item.id, item.title]));

  const contentGroups = group(entries, metricsByAd, (entry) => entry.content_item_id ?? "none", (key) =>
    key === "none"
      ? { label: <span className="text-ink-2">Tanpa konten</span> }
      : { label: titles.get(key) ?? "Konten terhapus", href: `/content/${key}` },
  );
  const platformGroups = group(entries, metricsByAd, (entry) => entry.platform, (key) => ({
    label: (
      <span className="inline-flex items-center gap-2">
        <PlatformTag platform={key} />
        {key === "instagram" ? "Instagram" : "Facebook"}
      </span>
    ),
  }));

  const rangeLabel =
    range.from || range.to ? `${range.from ? formatDate(range.from) : "awal"} – ${range.to ? formatDate(range.to) : "sekarang"}` : "Semua waktu";

  return (
    <>
      <PageHeader eyebrow={`Iklan · ${rangeLabel}`} title="Analitik">
        <div className="mt-5 flex flex-wrap items-end gap-x-6 gap-y-3">
          <nav className="flex gap-px border border-rule-strong bg-rule-strong" aria-label="Rentang waktu">
            {presets.map((preset) => (
              <Link
                key={preset.key}
                href={preset.key === "30" ? "/ads/analytics" : `/ads/analytics?range=${preset.key}`}
                aria-current={range.key === preset.key ? "true" : undefined}
                className={`px-3 py-1.5 text-[13px] ${range.key === preset.key ? "bg-ink text-paper" : "bg-panel hover:bg-sunk"}`}
              >
                {preset.label}
              </Link>
            ))}
          </nav>
          <form action="/ads/analytics" className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              name="from"
              aria-label="Dari tanggal"
              defaultValue={range.from ?? ""}
              className={`${inputClass} w-auto font-mono text-[13px]`}
            />
            <span className="text-ink-3">–</span>
            <input
              type="date"
              name="to"
              aria-label="Sampai tanggal"
              defaultValue={range.to ?? ""}
              className={`${inputClass} w-auto font-mono text-[13px]`}
            />
            <button type="submit" className={buttonClass("secondary")}>
              Terapkan
            </button>
          </form>
        </div>
      </PageHeader>

      <div className="px-6 lg:px-10">
        {failedLoads > 0 ? (
          <p className="pt-4 font-mono text-[12px] text-amber">
            Metrik {failedLoads} iklan gagal dimuat, angka di bawah tidak lengkap.
          </p>
        ) : null}

        {all.length === 0 ? (
          <Section title="Ringkasan">
            <p className="max-w-[60ch] text-ink-2">
              Tidak ada data performa di rentang ini. Pastikan iklan punya Meta ad ID lalu jalankan Sync Meta di halaman{" "}
              <Link href="/ads" className="underline underline-offset-4">
                Iklan
              </Link>
              .
            </p>
          </Section>
        ) : (
          <>
            <Section title="Ringkasan">
              <div className="space-y-8">
                <TotalsRow totals={totals(all)} />
                <SpendClicksCharts rows={rows} />
              </div>
            </Section>
            <Section title="Per konten">
              <GroupTable groups={contentGroups} />
            </Section>
            <Section title="Per platform">
              <GroupTable groups={platformGroups} />
            </Section>
            <Section title="Harian">
              <DailyTable rows={rows} />
            </Section>
          </>
        )}
      </div>
    </>
  );
}

function group(
  entries: AdEntry[],
  metricsByAd: Map<string, AdMetric[]>,
  keyOf: (entry: AdEntry) => string,
  describe: (key: string) => { label: ReactNode; href?: string },
): Group[] {
  const buckets = new Map<string, AdEntry[]>();
  entries.forEach((entry) => {
    const key = keyOf(entry);
    buckets.set(key, [...(buckets.get(key) ?? []), entry]);
  });
  return [...buckets.entries()]
    .map(([key, list]) => ({
      key,
      ...describe(key),
      ads: list.length,
      totals: totals(list.flatMap((entry) => metricsByAd.get(entry.id) ?? [])),
    }))
    .sort((a, b) => b.totals.spend - a.totals.spend);
}

function GroupTable({ groups }: { groups: Group[] }) {
  const maxSpend = Math.max(1, ...groups.map((entry) => entry.totals.spend));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-right text-[13px]">
        <thead>
          <tr className="border-b border-rule font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3">
            <th className="py-2 text-left font-normal">Nama</th>
            <th className="w-14 py-2 font-normal">Iklan</th>
            <th className="w-56 py-2 font-normal">Spend</th>
            <th className="py-2 font-normal">Impresi</th>
            <th className="py-2 font-normal">Klik</th>
            <th className="py-2 font-normal">CTR</th>
            <th className="py-2 font-normal">Per klik</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((row) => (
            <tr key={row.key} className="border-b border-rule">
              <td className="py-2.5 text-left">
                {row.href ? (
                  <Link href={row.href} className="hover:underline hover:underline-offset-4">
                    {row.label}
                  </Link>
                ) : (
                  row.label
                )}
              </td>
              <td className="py-2.5 font-mono text-ink-2">{row.ads}</td>
              <td className="py-2.5">
                <div className="flex items-center justify-end gap-3">
                  <span className="h-1.5 w-24 bg-sunk" aria-hidden>
                    <span className="block h-full bg-ink" style={{ width: `${(row.totals.spend / maxSpend) * 100}%` }} />
                  </span>
                  <span className="w-24 font-mono">{formatRupiah(row.totals.spend)}</span>
                </div>
              </td>
              <td className="py-2.5 font-mono">{formatInt(row.totals.impressions)}</td>
              <td className="py-2.5 font-mono">{formatInt(row.totals.clicks)}</td>
              <td className="py-2.5 font-mono text-ink-2">{formatPercent(row.totals.ctr)}</td>
              <td className="py-2.5 font-mono text-ink-2">
                {Number.isFinite(row.totals.cpc) ? formatRupiah(row.totals.cpc) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
