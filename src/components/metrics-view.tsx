import { Stat } from "@/components/ui";
import { formatCompact, formatInt, formatPercent, formatRupiah, formatShortDate } from "@/lib/format";
import type { DayRow, Totals } from "@/lib/metrics";

export { SpendClicksCharts } from "@/components/spend-clicks-charts";

export function TotalsRow({ totals }: { totals: Totals }) {
  return (
    <div className="grid grid-cols-2 gap-y-5 sm:grid-cols-3 lg:grid-cols-6">
      <Stat label="Spend" value={formatRupiah(totals.spend)} sub={`${totals.days} hari data`} />
      <Stat label="Impresi" value={formatCompact(totals.impressions)} sub={formatInt(totals.impressions)} />
      <Stat label="Reach" value={formatCompact(totals.reach)} sub="dijumlah per hari" />
      <Stat label="Klik" value={formatInt(totals.clicks)} />
      <Stat label="CTR" value={formatPercent(totals.ctr)} sub="klik / impresi" />
      <Stat
        label="Biaya per klik"
        value={Number.isFinite(totals.cpc) ? formatRupiah(totals.cpc) : "—"}
        sub={Number.isFinite(totals.cpm) ? `CPM ${formatRupiah(totals.cpm)}` : undefined}
      />
    </div>
  );
}

export function DailyTable({ rows }: { rows: DayRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-right font-mono text-[12px]">
        <thead>
          <tr className="border-b border-rule text-[11px] uppercase tracking-[0.06em] text-ink-3">
            <th className="py-2 text-left font-normal">Tanggal</th>
            <th className="py-2 font-normal">Spend</th>
            <th className="py-2 font-normal">Impresi</th>
            <th className="py-2 font-normal">Reach</th>
            <th className="py-2 font-normal">Klik</th>
            <th className="py-2 font-normal">CTR</th>
          </tr>
        </thead>
        <tbody>
          {[...rows].reverse().map((row) => (
            <tr key={row.date} className="border-b border-rule">
              <td className="py-2 text-left text-ink-2">{formatShortDate(`${row.date}T00:00:00Z`)}</td>
              <td className="py-2">{formatRupiah(row.spend)}</td>
              <td className="py-2">{formatInt(row.impressions)}</td>
              <td className="py-2">{formatInt(row.reach)}</td>
              <td className="py-2">{formatInt(row.clicks)}</td>
              <td className="py-2 text-ink-2">{formatPercent(row.impressions ? row.clicks / row.impressions : Number.NaN)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
