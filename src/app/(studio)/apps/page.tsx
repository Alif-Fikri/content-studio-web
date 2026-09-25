import type { Metadata } from "next";
import Link from "next/link";
import { ReleaseStatusTag, TrackTag } from "@/components/status";
import { LoadError } from "@/components/ui";
import { load } from "@/lib/api/server";
import type { AppDashboardEntry } from "@/lib/api/types";
import { formatRate, formatRelative } from "@/lib/format";
import { RegisterAppForm } from "./register-app-form";

export const metadata: Metadata = { title: "Apps" };

function vitalTone(rate: number): string {
  if (rate >= 2) return "text-rec";
  if (rate >= 1) return "text-amber";
  return "text-ink-2";
}

export default async function AppsPage() {
  const result = await load<AppDashboardEntry[]>("/apps/dashboard");

  if (!result.ok) {
    return (
      <>
        <header className="border-b border-rule px-6 pb-5 pt-7 lg:px-10">
          <h1 className="text-[22px] font-semibold tracking-[-0.01em]">Apps</h1>
        </header>
        <LoadError what="daftar app" error={result.error} />
      </>
    );
  }

  const entries = result.data ?? [];

  return (
    <>
      <header className="border-b border-rule px-6 pb-5 pt-7 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-3">{entries.length} app</div>
            <h1 className="text-[22px] font-semibold tracking-[-0.01em]">Apps</h1>
          </div>
          <RegisterAppForm />
        </div>
      </header>

      {entries.length === 0 ? (
        <div className="max-w-md px-6 py-16 lg:px-10">
          <p className="font-medium">Belum ada app terdaftar.</p>
          <p className="mt-1 text-ink-2">
            Daftarkan app di sini supaya rilis dari CI dan metrik Play Store bisa dipantau.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-rule font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3">
                <th className="py-2.5 pl-6 pr-4 font-normal lg:pl-10">App</th>
                <th className="w-56 px-4 py-2.5 font-normal">Rilis terakhir</th>
                <th className="w-20 px-4 py-2.5 text-right font-normal">Crash</th>
                <th className="w-20 px-4 py-2.5 text-right font-normal">ANR</th>
                <th className="w-28 px-4 py-2.5 text-right font-normal">Rating</th>
                <th className="w-32 py-2.5 pl-4 pr-6 text-right font-normal lg:pr-10">Update</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(({ app, latest_release, latest_metric }) => (
                <tr key={app.id} className="group relative border-b border-rule hover:bg-panel">
                  <td className="py-3 pl-6 pr-4 lg:pl-10">
                    <Link href={`/apps/${app.id}`} className="font-medium after:absolute after:inset-0 group-hover:underline group-hover:underline-offset-4">
                      {app.name}
                    </Link>
                    <div className="mt-0.5 font-mono text-[12px] text-ink-2">{app.package_name}</div>
                  </td>
                  <td className="px-4 py-3">
                    {latest_release ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <TrackTag track={latest_release.track} />
                        <span className="font-mono text-[12px]">{latest_release.version_name}</span>
                        <ReleaseStatusTag status={latest_release.status} />
                      </div>
                    ) : (
                      <span className="text-[13px] text-ink-3">belum ada rilis</span>
                    )}
                  </td>
                  <td className={`px-4 py-3 text-right font-mono text-[13px] ${latest_metric ? vitalTone(latest_metric.crash_rate) : "text-ink-3"}`}>
                    {latest_metric ? formatRate(latest_metric.crash_rate) : "—"}
                  </td>
                  <td className={`px-4 py-3 text-right font-mono text-[13px] ${latest_metric ? vitalTone(latest_metric.anr_rate) : "text-ink-3"}`}>
                    {latest_metric ? formatRate(latest_metric.anr_rate) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[13px]">
                    {latest_metric ? `${latest_metric.rating_avg.toFixed(1)} (${latest_metric.rating_count})` : "—"}
                  </td>
                  <td className="py-3 pl-4 pr-6 text-right font-mono text-[12px] text-ink-2 lg:pr-10">
                    {formatRelative(latest_metric?.date ?? app.updated_at)}
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
