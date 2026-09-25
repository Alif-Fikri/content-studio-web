"use client";

import { LineChart } from "@/components/line-chart";
import { formatRate } from "@/lib/format";
import type { AppMetric } from "@/lib/api/types";

export function VitalsCharts({ metrics }: { metrics: AppMetric[] }) {
  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <LineChart
        title="Crash rate"
        points={metrics.map((metric) => ({ date: metric.date, value: metric.crash_rate }))}
        format={formatRate}
        formatAxis={(value) => `${value.toFixed(1)}%`}
      />
      <LineChart
        title="ANR rate"
        points={metrics.map((metric) => ({ date: metric.date, value: metric.anr_rate }))}
        format={formatRate}
        formatAxis={(value) => `${value.toFixed(1)}%`}
      />
      <LineChart
        title="Rating rata-rata"
        points={metrics.map((metric) => ({ date: metric.date, value: metric.rating_avg }))}
        format={(value) => value.toFixed(2)}
        formatAxis={(value) => value.toFixed(1)}
      />
    </div>
  );
}
