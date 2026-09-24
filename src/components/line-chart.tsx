"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";

type Point = { date: string; value: number };

type Props = {
  title: string;
  points: Point[];
  format: (value: number) => string;
  formatAxis: (value: number) => string;
  height?: number;
};

const PAD = { top: 12, right: 12, bottom: 22, left: 52 };
const dayLabel = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "UTC" });
const fullDay = new Intl.DateTimeFormat("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

function niceMax(value: number) {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((candidate) => candidate * magnitude >= value) ?? 10;
  return step * magnitude;
}

function parseDay(value: string) {
  return new Date(`${value}T00:00:00Z`);
}

export function LineChart({ title, points, format, formatAxis, height = 160 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const innerW = Math.max(0, width - PAD.left - PAD.right);
  const innerH = height - PAD.top - PAD.bottom;
  const max = niceMax(Math.max(0, ...points.map((point) => point.value)));
  const x = (index: number) => PAD.left + (points.length <= 1 ? innerW / 2 : (index / (points.length - 1)) * innerW);
  const y = (value: number) => PAD.top + innerH - (value / max) * innerH;
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)},${y(point.value).toFixed(1)}`).join("");
  const gridValues = [0, max / 2, max];
  const labelEvery = Math.max(1, Math.ceil(points.length / Math.max(1, Math.floor(innerW / 64))));

  function onMove(event: PointerEvent<SVGRectElement>) {
    if (points.length === 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    setHover(Math.round(ratio * (points.length - 1)));
  }

  const hovered = hover !== null ? points[hover] : null;

  return (
    <figure className="min-w-0">
      <figcaption className="mb-2 flex items-baseline justify-between gap-4">
        <span className="text-[12px] font-medium text-ink-2">{title}</span>
        <span className="font-mono text-[11px] text-ink-3">
          {hovered ? fullDay.format(parseDay(hovered.date)) : `${points.length} hari`}
        </span>
      </figcaption>
      <div ref={ref} className="relative" style={{ height }}>
        {width > 0 && points.length > 0 ? (
          <svg width={width} height={height} className="block overflow-visible" role="img" aria-label={title}>
            {gridValues.map((value) => (
              <g key={value}>
                <line
                  x1={PAD.left}
                  x2={PAD.left + innerW}
                  y1={y(value)}
                  y2={y(value)}
                  stroke="var(--color-rule)"
                  strokeDasharray={value === 0 ? undefined : "2 3"}
                />
                <text x={PAD.left - 8} y={y(value)} dy="0.32em" textAnchor="end" className="fill-ink-3 font-mono text-[10px]">
                  {formatAxis(value)}
                </text>
              </g>
            ))}
            {points.map((point, index) =>
              index % labelEvery === 0 ? (
                <text
                  key={point.date}
                  x={x(index)}
                  y={height - 6}
                  textAnchor={points.length === 1 ? "middle" : index === 0 ? "start" : "middle"}
                  className="fill-ink-3 font-mono text-[10px]"
                >
                  {dayLabel.format(parseDay(point.date))}
                </text>
              ) : null,
            )}
            <path d={path} fill="none" stroke="var(--color-ink)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {points.length === 1 ? <circle cx={x(0)} cy={y(points[0].value)} r={4} fill="var(--color-ink)" /> : null}
            {hovered && hover !== null ? (
              <g pointerEvents="none">
                <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} stroke="var(--color-rec)" />
                <circle cx={x(hover)} cy={y(hovered.value)} r={4.5} fill="var(--color-ink)" stroke="var(--color-panel)" strokeWidth={2} />
              </g>
            ) : null}
            <rect
              x={PAD.left}
              y={0}
              width={innerW}
              height={height}
              fill="transparent"
              onPointerMove={onMove}
              onPointerLeave={() => setHover(null)}
            />
          </svg>
        ) : null}
        {hovered && hover !== null ? (
          <div
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 whitespace-nowrap bg-ink px-2 py-1 font-mono text-[11px] text-paper"
            style={{ left: Math.min(Math.max(x(hover), PAD.left + 40), width - 40) }}
          >
            {format(hovered.value)}
          </div>
        ) : null}
      </div>
    </figure>
  );
}
