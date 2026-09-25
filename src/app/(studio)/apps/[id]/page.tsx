import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReleaseStatusTag, TrackTag } from "@/components/status";
import { LoadError, PageHeader, Section } from "@/components/ui";
import { load } from "@/lib/api/server";
import type { App, AppMetric, Release } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { SyncButton } from "./sync-button";
import { VitalsCharts } from "./vitals-charts";

export async function generateMetadata({ params }: PageProps<"/apps/[id]">): Promise<Metadata> {
  const { id } = await params;
  const result = await load<App>(`/apps/${id}`);
  return { title: result.ok ? result.data.name : "App" };
}

export default async function AppPage({ params }: PageProps<"/apps/[id]">) {
  const { id } = await params;
  const app = await load<App>(`/apps/${id}`);

  if (!app.ok) {
    if (app.status === 404) notFound();
    return (
      <>
        <PageHeader eyebrow="Apps" title="Tidak bisa dibuka" />
        <LoadError what="app" error={app.error} />
      </>
    );
  }

  const [releases, metrics] = await Promise.all([load<Release[]>(`/apps/${id}/releases`), load<AppMetric[]>(`/apps/${id}/metrics`)]);
  const sortedMetrics = metrics.ok ? [...(metrics.data ?? [])].sort((a, b) => a.date.localeCompare(b.date)) : [];

  return (
    <>
      <PageHeader
        eyebrow="Apps"
        title={app.data.name}
        actions={
          app.data.play_console_url ? (
            <a
              href={app.data.play_console_url}
              target="_blank"
              rel="noreferrer"
              className="text-[13px] underline underline-offset-4 hover:text-ink"
            >
              Buka Play Console
            </a>
          ) : null
        }
      >
        <p className="mt-4 font-mono text-[13px] text-ink-2">{app.data.package_name}</p>
      </PageHeader>

      <div className="px-6 lg:px-10">
        <Section title="Vitals">
          {!metrics.ok ? (
            <p className="font-mono text-[12px] text-rec">Gagal memuat metrik: {metrics.error}</p>
          ) : sortedMetrics.length === 0 ? (
            <p className="max-w-[60ch] text-ink-2">Belum ada data vitals. Tekan Sync metrik untuk menarik dari Google Play.</p>
          ) : (
            <VitalsCharts metrics={sortedMetrics} />
          )}
          <div className="mt-6">
            <SyncButton appId={id} />
          </div>
        </Section>

        <Section title="Riwayat rilis">
          {!releases.ok ? (
            <p className="font-mono text-[12px] text-rec">Gagal memuat rilis: {releases.error}</p>
          ) : (releases.data ?? []).length === 0 ? (
            <p className="max-w-[60ch] text-ink-2">Belum ada rilis. Rilis baru dibuat dari pipeline CI, bukan dari dashboard ini.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-rule font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3">
                    <th className="py-2 pr-4 font-normal">Versi</th>
                    <th className="w-28 py-2 pr-4 font-normal">Track</th>
                    <th className="w-36 py-2 pr-4 font-normal">Status</th>
                    <th className="w-40 py-2 text-right font-normal">Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {(releases.data ?? []).map((release) => (
                    <tr key={release.id} className="border-b border-rule">
                      <td className="py-2.5 pr-4">
                        <span className="font-medium">{release.version_name}</span>
                        <span className="ml-1.5 font-mono text-[12px] text-ink-3">#{release.version_code}</span>
                        {release.status === "failed" && release.error ? (
                          <div className="mt-0.5 font-mono text-[11px] text-rec">{release.error}</div>
                        ) : null}
                      </td>
                      <td className="py-2.5 pr-4">
                        <TrackTag track={release.track} />
                      </td>
                      <td className="py-2.5 pr-4">
                        <ReleaseStatusTag status={release.status} />
                      </td>
                      <td className="py-2.5 text-right font-mono text-[12px] text-ink-2">
                        {formatDateTime(release.released_at ?? release.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        <div className="pb-8 pt-6">
          <Link href="/apps" className="text-[13px] text-ink-2 underline-offset-4 hover:text-ink hover:underline">
            ← Semua app
          </Link>
        </div>
      </div>
    </>
  );
}
