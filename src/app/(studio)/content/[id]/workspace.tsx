"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ContentStatusTag, RenderStatusTag } from "@/components/status";
import { Button, inputClass, Label, Notice, PageHeader, Section, Spinner } from "@/components/ui";
import { api, errorMessage, post } from "@/lib/api/browser";
import { ApiError } from "@/lib/api/http";
import type { AiProvider, ContentItem, ContentStatus, RenderJob } from "@/lib/api/types";
import { formatDateTime, timecode } from "@/lib/format";
import { productName } from "@/lib/products";
import { buildPrompt } from "@/lib/prompt";
import { beatKey, checkDraft, draftFromItem, parseBeats, sameAsItem, toScript, type Draft } from "./draft";
import { Timeline } from "./timeline";
import { useVideoUrl, VideoPreview } from "./video-preview";

const POLL_MS = 3000;
const editable: ContentStatus[] = ["ready_to_render", "ready", "failed"];

const providers: { value: AiProvider | ""; label: string }[] = [
  { value: "", label: "Default server" },
  { value: "claude", label: "Claude" },
  { value: "openai", label: "OpenAI" },
  { value: "gemini", label: "Gemini" },
];

export function Workspace({ initialItem }: { initialItem: ContentItem }) {
  const id = initialItem.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);

  const itemQuery = useQuery({
    queryKey: ["content", id],
    queryFn: () => api<ContentItem>(`/content-items/${id}`),
    initialData: initialItem,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "generating" || status === "rendering" ? POLL_MS : false;
    },
  });
  const item = itemQuery.data;

  const renderQuery = useQuery({
    queryKey: ["render", id],
    queryFn: async () => {
      try {
        return await api<RenderJob>(`/content-items/${id}/render`);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }
    },
    enabled: item.status === "rendering" || item.status === "ready" || item.status === "failed",
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return item.status === "rendering" || status === "queued" || status === "rendering" ? POLL_MS : false;
    },
  });
  const job = renderQuery.data ?? null;

  const [draft, setDraft] = useState<Draft>(() => draftFromItem(initialItem));
  const [seenStatus, setSeenStatus] = useState<ContentStatus>(initialItem.status);
  const [generateFailed, setGenerateFailed] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState<number | null>(null);

  if (item.status !== seenStatus) {
    setSeenStatus(item.status);
    if (seenStatus === "generating" && item.status === "ready_to_render") setDraft(draftFromItem(item));
    if (seenStatus === "generating" && item.status === "draft") setGenerateFailed(true);
  }

  const version = item.rendered_video_key ?? item.raw_video_key ?? null;
  const rendered = Boolean(item.rendered_video_key);
  const canEdit = editable.includes(item.status);
  const beats = useMemo(() => parseBeats(draft), [draft]);
  const check = useMemo(() => checkDraft(draft, duration), [draft, duration]);
  const dirty = canEdit && !sameAsItem(draft, item);
  const activeBeat = beats.find(
    (beat) => currentTime >= beat.start_seconds && currentTime < beat.start_seconds + beat.duration_seconds,
  );

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function setStatus(status: ContentStatus) {
    queryClient.setQueryData<ContentItem>(["content", id], (current) => (current ? { ...current, status } : current));
  }

  function seek(seconds: number) {
    const video = videoRef.current;
    if (video) video.currentTime = seconds;
    setCurrentTime(seconds);
  }

  const approve = useMutation({
    mutationFn: () => post(`/content-items/${id}/approve`, { caption: draft.caption.trim(), script: toScript(draft) }),
    onSuccess: () => {
      queryClient.setQueryData<ContentItem>(["content", id], (current) =>
        current ? { ...current, status: "rendering", caption: draft.caption.trim(), script: toScript(draft) } : current,
      );
      queryClient.invalidateQueries({ queryKey: ["render", id] });
      itemQuery.refetch();
    },
  });

  const remove = useMutation({
    mutationFn: () => api(`/content-items/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      router.push("/");
      router.refresh();
    },
  });

  return (
    <>
      <PageHeader
        eyebrow={`Konten / ${productName(item.product)}`}
        title={item.title}
        actions={
          <>
            <ContentStatusTag status={item.status} />
            <DeleteButton
              disabled={item.status === "rendering" || remove.isPending}
              pending={remove.isPending}
              onConfirm={() => remove.mutate()}
            />
          </>
        }
      />

      {remove.isError ? (
        <div className="px-6 pt-5 lg:px-10">
          <Notice tone="error" title="Gagal menghapus">
            {errorMessage(remove.error)}
          </Notice>
        </div>
      ) : null}

      <div className="grid gap-x-10 px-6 lg:grid-cols-[minmax(240px,340px)_minmax(0,1fr)] lg:px-10">
        <div className="pt-6 lg:sticky lg:top-0 lg:self-start lg:pb-6">
          <VideoPreview
            itemId={id}
            version={version}
            rendered={rendered}
            overlay={canEdit || item.status === "rendering" ? (activeBeat?.text ?? "") : null}
            videoRef={videoRef}
            currentTime={currentTime}
            duration={duration}
            onTime={setCurrentTime}
            onDuration={setDuration}
          />
        </div>

        <div className="min-w-0">
          <Section index="01" title="Brief">
            <p className="max-w-[65ch] text-[15px] leading-relaxed">{item.brief}</p>
            <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px] text-ink-3">
              <div>
                <dt className="inline">dibuat </dt>
                <dd className="inline text-ink-2">{formatDateTime(item.created_at)}</dd>
              </div>
              <div>
                <dt className="inline">diperbarui </dt>
                <dd className="inline text-ink-2">{formatDateTime(item.updated_at)}</dd>
              </div>
            </dl>
          </Section>

          <Section
            index="02"
            title="Caption & script"
            aside={dirty ? <span className="font-mono text-[11px] text-amber">belum di-approve</span> : null}
          >
            {item.status === "draft" && !item.raw_video_key ? (
              <Notice tone="warn" title="Rekaman belum ter-upload">
                Upload untuk konten ini tidak selesai. Hapus konten ini lalu buat ulang dari halaman Upload baru.
              </Notice>
            ) : item.status === "draft" ? (
              <GeneratePanel
                item={item}
                duration={duration}
                failed={generateFailed}
                onStarted={() => {
                  setGenerateFailed(false);
                  setStatus("generating");
                  setSeenStatus("generating");
                }}
              />
            ) : item.status === "generating" ? (
              <Working label="AI sedang menulis caption & script" since={item.updated_at} />
            ) : (
              <ScriptEditor
                draft={draft}
                setDraft={setDraft}
                locked={!canEdit}
                beats={beats}
                check={check}
                duration={duration}
                currentTime={currentTime}
                onSeek={seek}
                onReset={() => setDraft(draftFromItem(item))}
                dirty={dirty}
              />
            )}
          </Section>

          <Section index="03" title="Render" muted={!canEdit && item.status !== "rendering"}>
            <RenderPanel
              item={item}
              job={job}
              jobError={renderQuery.isError ? errorMessage(renderQuery.error) : null}
              canApprove={canEdit}
              blockers={check.errors}
              warnings={check.warnings}
              pending={approve.isPending}
              error={approve.isError ? errorMessage(approve.error) : null}
              onApprove={() => approve.mutate()}
            />
          </Section>

          <Section index="04" title="Hasil" muted={item.status !== "ready"}>
            {item.status === "ready" ? (
              <Output itemId={id} version={version} caption={item.caption ?? ""} title={item.title} />
            ) : (
              <p className="text-ink-2">Video final, caption, dan tombol download muncul di sini setelah render selesai.</p>
            )}
          </Section>
        </div>
      </div>
    </>
  );
}

function DeleteButton({ disabled, pending, onConfirm }: { disabled: boolean; pending: boolean; onConfirm: () => void }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <span className="flex items-center gap-1">
        <span className="mr-1 text-[12px] text-ink-2">Hapus konten ini?</span>
        <Button variant="danger" disabled={disabled} onClick={onConfirm}>
          {pending ? <Spinner /> : null}
          Ya, hapus
        </Button>
        <Button variant="ghost" onClick={() => setConfirming(false)}>
          Batal
        </Button>
      </span>
    );
  }

  return (
    <Button
      variant="ghost"
      disabled={disabled}
      title={disabled ? "Tidak bisa dihapus saat render berjalan" : undefined}
      onClick={() => setConfirming(true)}
    >
      Hapus
    </Button>
  );
}

function Working({ label, since }: { label: string; since: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  const elapsed = Math.max(0, (now - new Date(since).getTime()) / 1000);

  return (
    <div className="flex items-center gap-3 border border-rule-strong bg-panel px-4 py-3">
      <span className="size-2 animate-blink bg-amber" />
      <span>{label}</span>
      <span className="ml-auto font-mono text-[12px] text-ink-2">{timecode(elapsed)}</span>
    </div>
  );
}

function GeneratePanel({
  item,
  duration,
  failed,
  onStarted,
}: {
  item: ContentItem;
  duration: number | null;
  failed: boolean;
  onStarted: () => void;
}) {
  const [provider, setProvider] = useState<AiProvider | "">("");
  const [direction, setDirection] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);
  const prompt = buildPrompt({ item, durationSeconds: duration, direction });

  const generate = useMutation({
    mutationFn: () => post(`/content-items/${item.id}/generate`, provider ? { prompt, provider } : { prompt }),
    onSuccess: onStarted,
  });

  return (
    <div className="space-y-4">
      {failed ? (
        <Notice tone="error" title="Generate gagal">
          Server tidak mengirim detail error. Biasanya karena provider AI menolak request atau balasannya bukan JSON yang
          valid. Cek log API, lalu coba lagi. Bisa juga ganti provider.
        </Notice>
      ) : null}
      {item.caption ? (
        <Notice title="Ada caption & script lama">
          Generate baru akan menimpa caption dan script yang tersimpan.
        </Notice>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
        <div>
          <Label htmlFor="provider">Provider</Label>
          <select
            id="provider"
            value={provider}
            onChange={(event) => setProvider(event.target.value as AiProvider | "")}
            className={inputClass}
          >
            {providers.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="direction" hint="opsional">
            Arahan tambahan
          </Label>
          <input
            id="direction"
            value={direction}
            onChange={(event) => setDirection(event.target.value)}
            placeholder="mis. nada lebih lucu, sebut fitur ekspor"
            className={inputClass}
          />
        </div>
      </div>

      {generate.isError ? (
        <Notice tone="error" title="Request generate ditolak">
          {errorMessage(generate.error)}
        </Notice>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" disabled={generate.isPending} onClick={() => generate.mutate()}>
          {generate.isPending ? <Spinner /> : null}
          {failed ? "Coba generate lagi" : "Generate caption & script"}
        </Button>
        <button
          type="button"
          onClick={() => setShowPrompt((value) => !value)}
          className="text-[13px] text-ink-2 underline-offset-4 hover:text-ink hover:underline"
        >
          {showPrompt ? "Sembunyikan prompt" : "Lihat prompt"}
        </button>
        {duration === null ? (
          <span className="text-[12px] text-ink-3">Durasi video belum terbaca, prompt memakai perkiraan.</span>
        ) : null}
      </div>

      {showPrompt ? (
        <pre className="max-h-80 overflow-auto whitespace-pre-wrap border border-rule bg-panel p-3 font-mono text-[12px] leading-relaxed text-ink-2">
          {prompt}
        </pre>
      ) : null}
    </div>
  );
}

function ScriptEditor({
  draft,
  setDraft,
  locked,
  beats,
  check,
  duration,
  currentTime,
  onSeek,
  onReset,
  dirty,
}: {
  draft: Draft;
  setDraft: (update: (draft: Draft) => Draft) => void;
  locked: boolean;
  beats: ReturnType<typeof parseBeats>;
  check: ReturnType<typeof checkDraft>;
  duration: number | null;
  currentTime: number;
  onSeek: (seconds: number) => void;
  onReset: () => void;
  dirty: boolean;
}) {
  function updateBeat(key: string, field: "text" | "start" | "duration", value: string) {
    setDraft((current) => ({
      ...current,
      beats: current.beats.map((beat) => (beat.key === key ? { ...beat, [field]: value } : beat)),
    }));
  }

  function addBeat() {
    const end = Math.max(0, ...beats.filter((b) => Number.isFinite(b.start_seconds + b.duration_seconds)).map((b) => b.start_seconds + b.duration_seconds));
    setDraft((current) => ({
      ...current,
      beats: [...current.beats, { key: beatKey(), text: "", start: String(Math.round(end * 10) / 10), duration: "2" }],
    }));
  }

  function removeBeat(key: string) {
    setDraft((current) => ({ ...current, beats: current.beats.filter((beat) => beat.key !== key) }));
  }

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="caption" hint={`${draft.caption.length} karakter`}>
          Caption
        </Label>
        <textarea
          id="caption"
          rows={4}
          disabled={locked}
          value={draft.caption}
          onChange={(event) => setDraft((current) => ({ ...current, caption: event.target.value }))}
          className={`${inputClass} resize-y leading-relaxed`}
        />
      </div>

      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-[12px] font-medium text-ink-2">Script overlay</span>
          <span className="font-mono text-[11px] text-ink-3">klik timeline untuk loncat</span>
        </div>
        <Timeline
          beats={beats}
          videoSeconds={duration}
          currentTime={currentTime}
          overlapping={check.overlapping}
          overflowing={check.overflowing}
          onSeek={onSeek}
        />

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse">
            <thead>
              <tr className="border-b border-rule text-left font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3">
                <th className="w-8 pb-2 font-normal">#</th>
                <th className="pb-2 font-normal">Teks</th>
                <th className="w-20 pb-2 pl-2 font-normal">Mulai</th>
                <th className="w-20 pb-2 pl-2 font-normal">Durasi</th>
                <th className="w-16 pb-2 pl-2 text-right font-normal">Selesai</th>
                <th className="w-8 pb-2" />
              </tr>
            </thead>
            <tbody>
              {draft.beats.map((beat, index) => {
                const parsed = beats[index];
                const end = parsed.start_seconds + parsed.duration_seconds;
                const bad = check.overlapping.has(beat.key) || check.overflowing.has(beat.key);
                const label = index === 0 ? "hook" : index === draft.beats.length - 1 && index > 0 ? "cta" : null;
                return (
                  <tr key={beat.key} className="border-b border-rule align-top">
                    <td className="py-2 pr-2">
                      <button
                        type="button"
                        onClick={() => Number.isFinite(parsed.start_seconds) && onSeek(parsed.start_seconds)}
                        className={`font-mono text-[12px] hover:underline ${bad ? "text-rec" : "text-ink-2"}`}
                        title="Loncat ke beat ini"
                      >
                        {String(index + 1).padStart(2, "0")}
                      </button>
                      {label ? <div className="font-mono text-[9px] uppercase text-ink-3">{label}</div> : null}
                    </td>
                    <td className="py-1.5">
                      <input
                        aria-label={`Teks beat ${index + 1}`}
                        disabled={locked}
                        value={beat.text}
                        onChange={(event) => updateBeat(beat.key, "text", event.target.value)}
                        className={inputClass}
                      />
                    </td>
                    <td className="py-1.5 pl-2">
                      <NumberInput
                        label={`Mulai beat ${index + 1}`}
                        disabled={locked}
                        value={beat.start}
                        onChange={(value) => updateBeat(beat.key, "start", value)}
                      />
                    </td>
                    <td className="py-1.5 pl-2">
                      <NumberInput
                        label={`Durasi beat ${index + 1}`}
                        disabled={locked}
                        value={beat.duration}
                        onChange={(value) => updateBeat(beat.key, "duration", value)}
                      />
                    </td>
                    <td className={`py-3 pl-2 text-right font-mono text-[12px] ${bad ? "text-rec" : "text-ink-2"}`}>
                      {Number.isFinite(end) ? `${Math.round(end * 10) / 10}s` : "—"}
                    </td>
                    <td className="py-1.5 pl-1 text-right">
                      {!locked ? (
                        <button
                          type="button"
                          onClick={() => removeBeat(beat.key)}
                          aria-label={`Hapus beat ${index + 1}`}
                          className="size-8 text-ink-3 hover:bg-rec-soft hover:text-rec"
                        >
                          ×
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!locked ? (
          <div className="mt-3 flex items-center gap-2">
            <Button variant="ghost" onClick={addBeat}>
              + Tambah beat
            </Button>
            {dirty ? (
              <Button variant="ghost" onClick={onReset}>
                Kembalikan ke versi tersimpan
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function NumberInput({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <input
        aria-label={label}
        inputMode="decimal"
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputClass} pr-5 text-right font-mono text-[13px]`}
      />
      <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center font-mono text-[11px] text-ink-3">
        s
      </span>
    </div>
  );
}

function RenderPanel({
  item,
  job,
  jobError,
  canApprove,
  blockers,
  warnings,
  pending,
  error,
  onApprove,
}: {
  item: ContentItem;
  job: RenderJob | null;
  jobError: string | null;
  canApprove: boolean;
  blockers: string[];
  warnings: string[];
  pending: boolean;
  error: string | null;
  onApprove: () => void;
}) {
  const failedJob = job?.status === "failed" ? job : null;

  return (
    <div className="space-y-4">
      {item.status === "rendering" ? (
        <div className="border border-rule-strong bg-panel">
          <div className="flex items-center gap-3 px-4 py-3">
            {job ? <RenderStatusTag status={job.status} /> : <Spinner className="text-ink-3" />}
            <span className="text-ink-2">
              {job?.status === "queued" ? "Menunggu worker…" : "ffmpeg sedang membakar overlay ke video…"}
            </span>
            {job ? <Elapsed since={job.started_at ?? job.created_at} /> : null}
          </div>
          <div className="h-[3px] overflow-hidden bg-sunk">
            <div className="h-full w-1/3 animate-slide bg-rec" />
          </div>
        </div>
      ) : null}

      {failedJob ? (
        <Notice tone="error" title="Render gagal">
          <span className="font-mono text-[12px]">{failedJob.error ?? "Tanpa pesan error dari worker."}</span>
          <div className="mt-1">Perbaiki script bila perlu, lalu render ulang.</div>
        </Notice>
      ) : null}

      {job && job.status === "done" ? (
        <p className="font-mono text-[12px] text-ink-2">
          Render terakhir selesai {job.finished_at ? formatDateTime(job.finished_at) : ""}
          {job.started_at && job.finished_at
            ? ` · ${timecode((new Date(job.finished_at).getTime() - new Date(job.started_at).getTime()) / 1000)}`
            : ""}
        </p>
      ) : null}

      {jobError ? <p className="font-mono text-[12px] text-rec">Status render tidak terbaca: {jobError}</p> : null}

      {canApprove ? (
        <>
          {blockers.length > 0 ? (
            <ul className="space-y-0.5 text-[13px] text-rec">
              {blockers.map((message) => (
                <li key={message}>— {message}</li>
              ))}
            </ul>
          ) : null}
          {warnings.length > 0 ? (
            <ul className="space-y-0.5 text-[13px] text-amber">
              {warnings.map((message) => (
                <li key={message}>— {message}</li>
              ))}
            </ul>
          ) : null}
          {error ? (
            <Notice tone="error" title="Approve ditolak">
              {error}
            </Notice>
          ) : null}
          <div className="flex items-center gap-3">
            <Button variant="primary" disabled={pending || blockers.length > 0} onClick={onApprove}>
              {pending ? <Spinner /> : <span className="size-2 rounded-full bg-rec" />}
              {item.status === "ready_to_render" ? "Approve & render" : "Render ulang"}
            </Button>
            <span className="text-[12px] text-ink-3">Caption & script dikunci saat render dimulai.</span>
          </div>
        </>
      ) : item.status === "draft" || item.status === "generating" ? (
        <p className="text-ink-2">Render tersedia setelah caption & script ditulis.</p>
      ) : null}
    </div>
  );
}

function Elapsed({ since }: { since: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  return (
    <span className="ml-auto font-mono text-[12px] text-ink-2">
      {timecode(Math.max(0, (now - new Date(since).getTime()) / 1000))}
    </span>
  );
}

function Output({ itemId, version, caption, title }: { itemId: string; version: string | null; caption: string; title: string }) {
  const url = useVideoUrl(itemId, version);
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(caption);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="space-y-4">
      <div className="border border-rule-strong bg-panel">
        <div className="flex items-center justify-between border-b border-rule px-3 py-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3">Caption final</span>
          <Button variant="ghost" onClick={copy}>
            {copied ? "Tersalin ✓" : "Salin caption"}
          </Button>
        </div>
        <p className="whitespace-pre-wrap px-3 py-3 leading-relaxed">{caption}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {url.data ? (
          <a
            href={url.data}
            download={`${title}.mp4`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded-xs bg-ink px-4 text-[13px] font-medium text-paper hover:bg-ink/85"
          >
            Download mp4
          </a>
        ) : (
          <Button variant="primary" disabled>
            {url.isPending ? <Spinner /> : null}
            Download mp4
          </Button>
        )}
        <span className="text-[12px] text-ink-3">Link download berlaku ±15 menit. Posting manual di IG, TikTok, atau FB.</span>
      </div>
    </div>
  );
}
