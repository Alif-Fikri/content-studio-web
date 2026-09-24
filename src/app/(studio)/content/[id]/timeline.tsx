"use client";

import type { ParsedBeat } from "./draft";

type Props = {
  beats: ParsedBeat[];
  videoSeconds: number | null;
  currentTime: number;
  overlapping: Set<string>;
  overflowing: Set<string>;
  onSeek: (seconds: number) => void;
};

function tickStep(total: number) {
  if (total <= 10) return 1;
  if (total <= 30) return 5;
  if (total <= 90) return 10;
  return 30;
}

export function Timeline({ beats, videoSeconds, currentTime, overlapping, overflowing, onSeek }: Props) {
  const valid = beats.filter((beat) => Number.isFinite(beat.start_seconds) && Number.isFinite(beat.duration_seconds));
  const scriptEnd = Math.max(0, ...valid.map((beat) => beat.start_seconds + beat.duration_seconds));
  const total = Math.max(videoSeconds ?? 0, scriptEnd, 1);
  const step = tickStep(total);
  const ticks = Array.from({ length: Math.floor(total / step) + 1 }, (_, i) => i * step);
  const pct = (seconds: number) => `${(Math.min(seconds, total) / total) * 100}%`;

  return (
    <div className="select-none">
      <div
        role="slider"
        tabIndex={0}
        aria-label="Timeline script"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={Math.round(currentTime * 10) / 10}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") onSeek(Math.min(total, currentTime + 0.5));
          if (event.key === "ArrowLeft") onSeek(Math.max(0, currentTime - 0.5));
        }}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          onSeek(((event.clientX - rect.left) / rect.width) * total);
        }}
        className="relative h-14 cursor-pointer border border-rule-strong bg-panel"
      >
        {videoSeconds && videoSeconds < total ? (
          <div
            className="absolute inset-y-0 right-0 bg-[repeating-linear-gradient(135deg,transparent_0_4px,var(--color-rec-soft)_4px_8px)]"
            style={{ left: pct(videoSeconds) }}
            title="Di luar durasi video"
          />
        ) : null}

        {valid.map((beat) => {
          const bad = overlapping.has(beat.key) || overflowing.has(beat.key);
          const active = currentTime >= beat.start_seconds && currentTime < beat.start_seconds + beat.duration_seconds;
          return (
            <div
              key={beat.key}
              title={beat.text}
              className={`absolute top-2 bottom-2 overflow-hidden border px-1.5 text-[11px] leading-[38px] whitespace-nowrap ${
                bad
                  ? "border-rec bg-rec-soft text-rec"
                  : active
                    ? "border-ink bg-ink text-paper"
                    : "border-ink/60 bg-sunk text-ink"
              }`}
              style={{ left: pct(beat.start_seconds), width: `calc(${pct(beat.duration_seconds)} - 1px)` }}
            >
              <span className="font-mono">{beat.index + 1}</span> {beat.text}
            </div>
          );
        })}

        <div className="pointer-events-none absolute inset-y-0 w-px bg-rec" style={{ left: pct(currentTime) }}>
          <span className="absolute -top-1 -left-[3px] size-[7px] bg-rec" />
        </div>
      </div>

      <div className="relative mt-1 h-4 font-mono text-[10px] text-ink-3">
        {ticks.map((tick) => (
          <span key={tick} className="absolute -translate-x-1/2 first:translate-x-0" style={{ left: pct(tick) }}>
            {tick}s
          </span>
        ))}
      </div>
    </div>
  );
}
