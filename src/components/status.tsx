import type { ContentStatus, ReleaseStatus, RenderStatus } from "@/lib/api/types";

type Look = { label: string; dot: string; text: string; live?: boolean };

export const contentStatusLook: Record<ContentStatus, Look> = {
  draft: { label: "Draft", dot: "border border-ink-3 bg-transparent", text: "text-ink-2" },
  generating: { label: "Menulis", dot: "bg-amber", text: "text-amber", live: true },
  ready_to_render: { label: "Siap render", dot: "bg-ink", text: "text-ink" },
  rendering: { label: "Rendering", dot: "bg-rec", text: "text-rec", live: true },
  ready: { label: "Selesai", dot: "bg-ok", text: "text-ok" },
  failed: { label: "Gagal", dot: "bg-rec", text: "text-rec" },
};

const renderStatusLook: Record<RenderStatus, Look> = {
  queued: { label: "Antre", dot: "border border-ink-3", text: "text-ink-2", live: true },
  rendering: { label: "Rendering", dot: "bg-rec", text: "text-rec", live: true },
  done: { label: "Selesai", dot: "bg-ok", text: "text-ok" },
  failed: { label: "Gagal", dot: "bg-rec", text: "text-rec" },
};

function Tag({ look }: { look: Look }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.06em] ${look.text}`}>
      <span className={`size-[7px] shrink-0 ${look.dot} ${look.live ? "animate-blink" : ""}`} />
      {look.label}
    </span>
  );
}

export function ContentStatusTag({ status }: { status: ContentStatus }) {
  return <Tag look={contentStatusLook[status]} />;
}

export function RenderStatusTag({ status }: { status: RenderStatus }) {
  return <Tag look={renderStatusLook[status]} />;
}

const releaseStatusLook: Record<ReleaseStatus, Look> = {
  draft: { label: "Draft", dot: "border border-ink-3 bg-transparent", text: "text-ink-2" },
  uploaded: { label: "Ter-upload", dot: "bg-ink", text: "text-ink" },
  publishing: { label: "Publishing", dot: "bg-amber", text: "text-amber", live: true },
  rolled_out: { label: "Rolled out", dot: "bg-ok", text: "text-ok" },
  failed: { label: "Gagal", dot: "bg-rec", text: "text-rec" },
};

export function ReleaseStatusTag({ status }: { status: ReleaseStatus }) {
  return <Tag look={releaseStatusLook[status]} />;
}

const trackLabel: Record<string, string> = {
  internal: "Internal",
  closed: "Closed",
  open: "Open",
  production: "Production",
};

export function TrackTag({ track }: { track: string }) {
  return (
    <span className="inline-flex h-5 items-center rounded-xs border border-rule-strong px-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.04em]">
      {trackLabel[track] ?? track}
    </span>
  );
}

export function PlatformTag({ platform }: { platform: string }) {
  const short = platform === "instagram" ? "IG" : platform === "facebook" ? "FB" : platform;
  return (
    <span className="inline-flex h-5 min-w-7 items-center justify-center rounded-xs border border-rule-strong px-1 font-mono text-[10px] font-medium tracking-[0.04em]">
      {short}
    </span>
  );
}
