import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DailyTable, SpendClicksCharts, TotalsRow } from "@/components/metrics-view";
import { ContentStatusTag, PlatformTag } from "@/components/status";
import { LoadError, PageHeader, Section } from "@/components/ui";
import { load } from "@/lib/api/server";
import type { AdEntry, AdMetric, ContentItem } from "@/lib/api/types";
import { formatDate, formatRupiah } from "@/lib/format";
import { byDay, totals } from "@/lib/metrics";
import { productName } from "@/lib/products";

export const metadata: Metadata = { title: "Detail iklan" };

export default async function AdPage({ params }: PageProps<"/ads/[id]">) {
  const { id } = await params;
  const [ad, metrics] = await Promise.all([load<AdEntry>(`/ads/${id}`), load<AdMetric[]>(`/ads/${id}/metrics`)]);

  if (!ad.ok) {
    if (ad.status === 404) notFound();
    return (
      <>
        <PageHeader eyebrow="Iklan" title="Tidak bisa dibuka" />
        <LoadError what="iklan" error={ad.error} />
      </>
    );
  }

  const entry = ad.data;
  const linked = entry.content_item_id ? await load<ContentItem>(`/content-items/${entry.content_item_id}`) : null;
  const rows = metrics.ok ? byDay(metrics.data ?? []) : [];
  const sum = totals(metrics.ok ? (metrics.data ?? []) : []);
  const platform = entry.platform === "instagram" ? "Instagram" : "Facebook";

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/ads" className="hover:text-ink">
            Iklan / {platform}
          </Link>
        }
        title={linked?.ok ? linked.data.title : `Iklan ${platform}`}
        actions={<PlatformTag platform={entry.platform} />}
      >
        <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-[13px]">
          <Meta label="Budget tercatat" value={formatRupiah(Number(entry.spend))} />
          <Meta label="Mulai" value={formatDate(entry.started_at)} />
          <Meta label="Meta ad ID" value={entry.external_ad_id ?? "— tidak di-sync"} />
        </dl>
      </PageHeader>

      <div className="px-6 lg:px-10">
        {linked ? (
          <Section title="Konten terkait">
            {linked.ok ? (
              <Link
                href={`/content/${linked.data.id}`}
                className="group flex flex-wrap items-baseline gap-x-4 gap-y-1 border border-rule-strong bg-panel px-4 py-3 hover:border-ink"
              >
                <span className="font-medium group-hover:underline group-hover:underline-offset-4">{linked.data.title}</span>
                <span className="text-[13px] text-ink-2">{productName(linked.data.product)}</span>
                <ContentStatusTag status={linked.data.status} />
                <span className="w-full truncate text-[13px] text-ink-2">{linked.data.caption ?? linked.data.brief}</span>
              </Link>
            ) : (
              <p className="text-ink-2">
                {linked.status === 404 ? "Konten terkait sudah dihapus." : `Gagal memuat konten: ${linked.error}`}
              </p>
            )}
          </Section>
        ) : null}

        <Section title="Performa">
          {!metrics.ok ? (
            <p className="font-mono text-[12px] text-rec">Gagal memuat metrik: {metrics.error}</p>
          ) : rows.length === 0 ? (
            <p className="max-w-[60ch] text-ink-2">
              {entry.external_ad_id
                ? "Belum ada data. Tekan Sync Meta di halaman Iklan untuk menarik Insights harian."
                : "Iklan ini tidak punya Meta ad ID, jadi tidak ada data performa yang bisa ditarik."}
            </p>
          ) : (
            <div className="space-y-8">
              <TotalsRow totals={sum} />
              <SpendClicksCharts rows={rows} />
            </div>
          )}
        </Section>

        {rows.length > 0 ? (
          <Section title="Harian">
            <DailyTable rows={rows} />
          </Section>
        ) : null}
      </div>
    </>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[12px] text-ink-3">{label}</dt>
      <dd className="font-mono text-[13px]">{value}</dd>
    </div>
  );
}
