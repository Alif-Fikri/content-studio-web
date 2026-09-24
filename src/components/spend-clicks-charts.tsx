"use client";

import { LineChart } from "@/components/line-chart";
import { formatCompact, formatInt, formatRupiah } from "@/lib/format";
import type { DayRow } from "@/lib/metrics";

export function SpendClicksCharts({ rows }: { rows: DayRow[] }) {
  return (
    <div className="grid gap-8 xl:grid-cols-2">
      <LineChart
        title="Spend harian"
        points={rows.map((row) => ({ date: row.date, value: row.spend }))}
        format={formatRupiah}
        formatAxis={formatCompact}
      />
      <LineChart
        title="Klik harian"
        points={rows.map((row) => ({ date: row.date, value: row.clicks }))}
        format={(value) => `${formatInt(value)} klik`}
        formatAxis={formatCompact}
      />
    </div>
  );
}
