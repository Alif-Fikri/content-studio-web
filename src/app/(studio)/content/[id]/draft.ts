import type { ContentItem, ScriptBeat } from "@/lib/api/types";

export type BeatDraft = { key: string; text: string; start: string; duration: string };
export type Draft = { caption: string; beats: BeatDraft[] };

let counter = 0;
export function beatKey() {
  counter += 1;
  return `beat-${counter}`;
}

function trimNumber(value: number): string {
  return String(Math.round(value * 100) / 100);
}

export function draftFromItem(item: ContentItem): Draft {
  return {
    caption: item.caption ?? "",
    beats: (item.script ?? []).map((beat) => ({
      key: beatKey(),
      text: beat.text,
      start: trimNumber(beat.start_seconds),
      duration: trimNumber(beat.duration_seconds),
    })),
  };
}

export type ParsedBeat = ScriptBeat & { key: string; index: number };

export function parseBeats(draft: Draft): ParsedBeat[] {
  return draft.beats.map((beat, index) => ({
    key: beat.key,
    index,
    text: beat.text,
    start_seconds: Number.parseFloat(beat.start.replace(",", ".")),
    duration_seconds: Number.parseFloat(beat.duration.replace(",", ".")),
  }));
}

export type Check = { errors: string[]; warnings: string[]; overlapping: Set<string>; overflowing: Set<string> };

export function checkDraft(draft: Draft, videoSeconds: number | null): Check {
  const errors: string[] = [];
  const warnings: string[] = [];
  const overlapping = new Set<string>();
  const overflowing = new Set<string>();
  const beats = parseBeats(draft);

  if (!draft.caption.trim()) errors.push("Caption masih kosong.");
  if (beats.length === 0) errors.push("Script butuh minimal satu beat.");

  beats.forEach((beat) => {
    const n = beat.index + 1;
    if (!beat.text.trim()) errors.push(`Beat ${n}: teks kosong.`);
    if (!Number.isFinite(beat.start_seconds) || beat.start_seconds < 0) errors.push(`Beat ${n}: waktu mulai tidak valid.`);
    if (!Number.isFinite(beat.duration_seconds) || beat.duration_seconds <= 0) errors.push(`Beat ${n}: durasi harus lebih dari 0.`);
    if (videoSeconds && beat.start_seconds + beat.duration_seconds > videoSeconds + 0.05) {
      overflowing.add(beat.key);
      warnings.push(`Beat ${n} berakhir setelah video selesai.`);
    }
  });

  const sorted = [...beats]
    .filter((beat) => Number.isFinite(beat.start_seconds) && Number.isFinite(beat.duration_seconds))
    .sort((a, b) => a.start_seconds - b.start_seconds);
  for (let i = 1; i < sorted.length; i += 1) {
    const previous = sorted[i - 1];
    if (sorted[i].start_seconds < previous.start_seconds + previous.duration_seconds - 0.01) {
      overlapping.add(sorted[i].key);
      overlapping.add(previous.key);
      warnings.push(`Beat ${previous.index + 1} dan ${sorted[i].index + 1} bertumpuk.`);
    }
  }

  return { errors, warnings, overlapping, overflowing };
}

export function toScript(draft: Draft): ScriptBeat[] {
  return parseBeats(draft).map(({ text, start_seconds, duration_seconds }) => ({
    text: text.trim(),
    start_seconds,
    duration_seconds,
  }));
}

export function sameAsItem(draft: Draft, item: ContentItem): boolean {
  if (draft.caption !== (item.caption ?? "")) return false;
  const script = item.script ?? [];
  const beats = parseBeats(draft);
  if (beats.length !== script.length) return false;
  return beats.every(
    (beat, i) =>
      beat.text === script[i].text &&
      Math.abs(beat.start_seconds - script[i].start_seconds) < 0.01 &&
      Math.abs(beat.duration_seconds - script[i].duration_seconds) < 0.01,
  );
}
