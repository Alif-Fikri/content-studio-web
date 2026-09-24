import type { AdMetric } from "@/lib/api/types";

export type Totals = {
  impressions: number;
  reach: number;
  clicks: number;
  spend: number;
  ctr: number;
  cpc: number;
  cpm: number;
  days: number;
};

export type DayRow = { date: string; impressions: number; reach: number; clicks: number; spend: number };

export function day(value: string): string {
  return value.slice(0, 10);
}

export function totals(metrics: AdMetric[]): Totals {
  const sum = metrics.reduce(
    (acc, metric) => ({
      impressions: acc.impressions + metric.impressions,
      reach: acc.reach + metric.reach,
      clicks: acc.clicks + metric.clicks,
      spend: acc.spend + Number(metric.spend),
    }),
    { impressions: 0, reach: 0, clicks: 0, spend: 0 },
  );
  return {
    ...sum,
    ctr: sum.impressions > 0 ? sum.clicks / sum.impressions : Number.NaN,
    cpc: sum.clicks > 0 ? sum.spend / sum.clicks : Number.NaN,
    cpm: sum.impressions > 0 ? (sum.spend / sum.impressions) * 1000 : Number.NaN,
    days: new Set(metrics.map((metric) => day(metric.date))).size,
  };
}

export function byDay(metrics: AdMetric[]): DayRow[] {
  if (metrics.length === 0) return [];
  const rows = new Map<string, DayRow>();
  metrics.forEach((metric) => {
    const key = day(metric.date);
    const row = rows.get(key) ?? { date: key, impressions: 0, reach: 0, clicks: 0, spend: 0 };
    row.impressions += metric.impressions;
    row.reach += metric.reach;
    row.clicks += metric.clicks;
    row.spend += Number(metric.spend);
    rows.set(key, row);
  });

  const keys = [...rows.keys()].sort();
  const filled: DayRow[] = [];
  const cursor = new Date(`${keys[0]}T00:00:00Z`);
  const last = new Date(`${keys[keys.length - 1]}T00:00:00Z`);
  while (cursor <= last) {
    const key = cursor.toISOString().slice(0, 10);
    filled.push(rows.get(key) ?? { date: key, impressions: 0, reach: 0, clicks: 0, spend: 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return filled;
}

export function inRange(metrics: AdMetric[], from: string | null, to: string | null): AdMetric[] {
  return metrics.filter((metric) => {
    const key = day(metric.date);
    return (!from || key >= from) && (!to || key <= to);
  });
}
