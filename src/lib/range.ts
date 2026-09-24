import { isoDay } from "@/lib/format";

export const presets = [
  { key: "7", label: "7 hari", days: 7 },
  { key: "30", label: "30 hari", days: 30 },
  { key: "90", label: "90 hari", days: 90 },
  { key: "all", label: "Semua", days: null },
] as const;

export type Range = { key: string; from: string | null; to: string | null };

const dayPattern = /^\d{4}-\d{2}-\d{2}$/;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function resolveRange(params: Record<string, string | string[] | undefined>): Range {
  const from = first(params.from);
  const to = first(params.to);
  if ((from && dayPattern.test(from)) || (to && dayPattern.test(to))) {
    return {
      key: "custom",
      from: from && dayPattern.test(from) ? from : null,
      to: to && dayPattern.test(to) ? to : null,
    };
  }

  const preset = presets.find((candidate) => candidate.key === first(params.range)) ?? presets[1];
  if (preset.days === null) return { key: preset.key, from: null, to: null };

  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (preset.days - 1));
  return { key: preset.key, from: isoDay(start), to: isoDay(end) };
}
