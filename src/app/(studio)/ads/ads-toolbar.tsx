"use client";

import { useRouter } from "next/navigation";
import { useState, type SubmitEvent } from "react";
import { Button, inputClass, Label, Notice, Spinner } from "@/components/ui";
import { errorMessage, post } from "@/lib/api/browser";
import type { AdPlatform, SyncResult } from "@/lib/api/types";
import { isoDay } from "@/lib/format";

type ContentOption = { id: string; title: string };

export function AdsToolbar({ contentOptions, syncable }: { contentOptions: ContentOption[]; syncable: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ tone: "ok" | "warn" | "error"; text: string } | null>(null);

  async function sync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await post<SyncResult>("/ads/sync");
      const failed = result.total - result.synced;
      setSyncResult(
        failed > 0
          ? { tone: "warn", text: `${result.synced} dari ${result.total} iklan tersinkron. ${failed} gagal, cek external ad ID atau token Meta.` }
          : { tone: "ok", text: `${result.synced} iklan tersinkron dari Meta Insights.` },
      );
      router.refresh();
    } catch (error) {
      setSyncResult({ tone: "error", text: errorMessage(error) });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={sync}
          disabled={syncing || syncable === 0}
          title={syncable === 0 ? "Belum ada iklan dengan Meta ad ID" : undefined}
        >
          {syncing ? <Spinner /> : null}
          {syncing ? "Menyinkron…" : "Sync Meta"}
        </Button>
        <Button variant="primary" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
          {open ? "Tutup form" : "Catat iklan"}
        </Button>
      </div>

      {syncResult ? (
        <div className="basis-full pt-4">
          <Notice tone={syncResult.tone} title={syncResult.tone === "error" ? "Sync gagal" : "Sync selesai"}>
            {syncResult.text}
          </Notice>
        </div>
      ) : null}

      {open ? (
        <div className="basis-full pt-5">
          <AdForm
            contentOptions={contentOptions}
            onDone={() => {
              setOpen(false);
              router.refresh();
            }}
          />
        </div>
      ) : null}
    </>
  );
}

function AdForm({ contentOptions, onDone }: { contentOptions: ContentOption[]; onDone: () => void }) {
  const [platform, setPlatform] = useState<AdPlatform>("instagram");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const contentItemId = String(form.get("content_item_id") ?? "");
    const externalAdId = String(form.get("external_ad_id") ?? "").trim();
    setPending(true);
    setError(null);
    try {
      await post("/ads", {
        platform,
        content_item_id: contentItemId || null,
        spend: Number(form.get("spend") || 0),
        started_at: String(form.get("started_at")),
        external_ad_id: externalAdId || null,
      });
      onDone();
    } catch (err) {
      setError(errorMessage(err));
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="border border-rule-strong bg-panel p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[auto_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)]">
        <fieldset>
          <legend className="mb-1.5 text-[12px] font-medium text-ink-2">Platform</legend>
          <div className="flex gap-px border border-rule-strong bg-rule-strong">
            {(["instagram", "facebook"] as const).map((option) => (
              <label
                key={option}
                className={`cursor-pointer px-3 py-1.5 text-[13px] has-focus-visible:outline-2 has-focus-visible:outline-ink ${
                  platform === option ? "bg-ink text-paper" : "bg-panel hover:bg-sunk"
                }`}
              >
                <input
                  type="radio"
                  name="platform"
                  value={option}
                  checked={platform === option}
                  onChange={() => setPlatform(option)}
                  className="sr-only"
                />
                {option === "instagram" ? "Instagram" : "Facebook"}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <Label htmlFor="content_item_id" hint="opsional">
            Konten
          </Label>
          <select id="content_item_id" name="content_item_id" defaultValue="" className={inputClass}>
            <option value="">— Tidak terkait —</option>
            {contentOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="spend" hint="IDR">
            Budget / spend
          </Label>
          <input
            id="spend"
            name="spend"
            type="number"
            min={0}
            step={1000}
            inputMode="numeric"
            placeholder="150000"
            className={`${inputClass} font-mono`}
          />
        </div>
        <div>
          <Label htmlFor="started_at">Mulai</Label>
          <input id="started_at" name="started_at" type="date" required defaultValue={isoDay(new Date())} className={`${inputClass} font-mono`} />
        </div>
        <div>
          <Label htmlFor="external_ad_id" hint="untuk sync">
            Meta ad ID
          </Label>
          <input id="external_ad_id" name="external_ad_id" placeholder="2385…" className={`${inputClass} font-mono`} />
        </div>
      </div>

      {error ? (
        <div className="mt-4">
          <Notice tone="error" title="Gagal menyimpan">
            {error}
          </Notice>
        </div>
      ) : null}

      <div className="mt-4 flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? <Spinner /> : null}
          Simpan iklan
        </Button>
        <span className="text-[12px] text-ink-3">Tanpa Meta ad ID, iklan tetap tercatat tapi tidak bisa di-sync.</span>
      </div>
    </form>
  );
}
