"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type DragEvent, type ReactNode, type SubmitEvent } from "react";
import { Button, inputClass, Label, Notice, Spinner } from "@/components/ui";
import { errorMessage, post } from "@/lib/api/browser";
import type { CreateContentResponse } from "@/lib/api/types";
import { formatBytes, timecode } from "@/lib/format";
import { products } from "@/lib/products";

const MAX_BYTES = 200 * 1024 * 1024;
const TARGET_SECONDS = 120;
const BRIEF_LIMIT = 280;

type Phase =
  | { kind: "idle" }
  | { kind: "creating" }
  | { kind: "uploading"; id: string; loaded: number; total: number }
  | { kind: "confirming"; id: string }
  | { kind: "failed"; message: string; id?: string };

type Picked = { file: File; url: string; duration: number | null };

function putFile(url: string, file: File, onProgress: (loaded: number, total: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
    xhr.upload.onprogress = (event) => onProgress(event.loaded, event.lengthComputable ? event.total : file.size);
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Storage menolak upload (HTTP ${xhr.status}).`));
    xhr.onerror = () => reject(new Error("Koneksi ke storage terputus saat upload. Cek CORS bucket R2 untuk method PUT."));
    xhr.send(file);
  });
}

export function UploadForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [product, setProduct] = useState(products[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [picked, setPicked] = useState<Picked | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });

  const previewUrl = picked?.url;
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const busy = phase.kind === "creating" || phase.kind === "uploading" || phase.kind === "confirming";

  function pick(file: File | undefined) {
    setFileError(null);
    if (!file) return;
    if (file.type !== "video/mp4" && !file.name.toLowerCase().endsWith(".mp4")) {
      setFileError("Hanya file .mp4 yang didukung.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setFileError(`Ukuran ${formatBytes(file.size)} melebihi batas ${formatBytes(MAX_BYTES)}. Kompres atau potong rekamannya dulu.`);
      return;
    }
    setPicked({ file, url: URL.createObjectURL(file), duration: null });
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (!busy) pick(event.dataTransfer.files[0]);
  }

  async function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!picked) {
      setFileError("Pilih rekaman layar dulu.");
      return;
    }

    setPhase({ kind: "creating" });
    let id: string | undefined;
    try {
      const created = await post<CreateContentResponse>("/content-items", {
        product,
        title: title.trim(),
        brief: brief.trim(),
      });
      id = created.id;
      const itemId = created.id;
      setPhase({ kind: "uploading", id: itemId, loaded: 0, total: picked.file.size });
      await putFile(created.upload_url, picked.file, (loaded, total) =>
        setPhase({ kind: "uploading", id: itemId, loaded, total }),
      );
      setPhase({ kind: "confirming", id: itemId });
      await post(`/content-items/${itemId}/upload-complete`);
      router.push(`/content/${itemId}`);
      router.refresh();
    } catch (error) {
      setPhase({ kind: "failed", message: errorMessage(error), id });
    }
  }

  const overLength = picked?.duration != null && picked.duration > TARGET_SECONDS;

  return (
    <form onSubmit={onSubmit} className="grid max-w-5xl gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <fieldset disabled={busy}>
          <legend className="mb-2 text-[12px] font-medium text-ink-2">Produk</legend>
          <div className="flex flex-wrap gap-px border border-rule-strong bg-rule-strong">
            {products.map((option) => (
              <label
                key={option.id}
                className={`flex-1 cursor-pointer px-4 py-2.5 text-center text-[13px] transition-colors has-focus-visible:outline-2 has-focus-visible:outline-ink ${
                  product === option.id ? "bg-ink text-paper" : "bg-panel text-ink hover:bg-sunk"
                }`}
              >
                <input
                  type="radio"
                  name="product"
                  value={option.id}
                  checked={product === option.id}
                  onChange={() => setProduct(option.id)}
                  className="sr-only"
                />
                {option.name}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <Label htmlFor="title">Judul internal</Label>
          <input
            id="title"
            required
            disabled={busy}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="mis. Hook pengeluaran bulanan v2"
            className={inputClass}
          />
        </div>

        <div>
          <Label htmlFor="brief" hint={`${brief.length}/${BRIEF_LIMIT}`}>
            Brief
          </Label>
          <textarea
            id="brief"
            required
            rows={3}
            maxLength={BRIEF_LIMIT}
            disabled={busy}
            value={brief}
            onChange={(event) => setBrief(event.target.value)}
            placeholder="Satu kalimat: sudut pandang iklan ini. mis. Tunjukkan betapa cepatnya mencatat pengeluaran setelah makan siang."
            className={`${inputClass} resize-y`}
          />
          <p className="mt-1.5 text-[12px] text-ink-3">Brief ini jadi bahan utama prompt AI untuk caption dan script.</p>
        </div>

        <div>
          <Label hint="mp4 · maks. 200 MB · target ≤ 2 menit">Rekaman layar</Label>
          <div
            onDragOver={(event) => {
              event.preventDefault();
              if (!busy) setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`relative border border-dashed transition-colors ${
              dragging ? "border-ink bg-sunk" : fileError ? "border-rec" : "border-rule-strong bg-panel"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="video/mp4,.mp4"
              disabled={busy}
              onChange={(event) => pick(event.target.files?.[0])}
              className="sr-only"
              id="file"
            />
            {picked ? (
              <div className="flex items-center gap-4 p-3">
                <video
                  src={picked.url}
                  muted
                  playsInline
                  preload="metadata"
                  onLoadedMetadata={(event) => {
                    const duration = event.currentTarget.duration;
                    setPicked((current) => (current && current.url === picked.url ? { ...current, duration } : current));
                  }}
                  className="h-24 w-16 shrink-0 bg-ink object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{picked.file.name}</div>
                  <div className="mt-0.5 font-mono text-[12px] text-ink-2">
                    {formatBytes(picked.file.size)} · {picked.duration != null ? timecode(picked.duration) : "membaca durasi…"}
                  </div>
                  {overLength ? (
                    <div className="mt-1 text-[12px] text-amber">
                      Lebih dari 2 menit. Tetap bisa di-upload, tapi video pendek biasanya performanya lebih baik.
                    </div>
                  ) : null}
                </div>
                <Button variant="ghost" disabled={busy} onClick={() => inputRef.current?.click()}>
                  Ganti
                </Button>
              </div>
            ) : (
              <label htmlFor="file" className="flex cursor-pointer flex-col items-center px-6 py-12 text-center">
                <span className="font-medium">Tarik file ke sini</span>
                <span className="mt-1 text-[13px] text-ink-2">
                  atau <span className="underline underline-offset-4">pilih dari komputer</span>
                </span>
              </label>
            )}
          </div>
          {fileError ? <p className="mt-1.5 text-[12px] text-rec">{fileError}</p> : null}
        </div>
      </div>

      <aside className="lg:border-l lg:border-rule lg:pl-8">
        <div className="lg:sticky lg:top-8">
          <ol className="space-y-3 text-[13px]">
            <Step n="1" label="Buat draft" state={stepState(phase, "creating")} />
            <Step
              n="2"
              label="Upload ke storage"
              state={stepState(phase, "uploading")}
              detail={
                phase.kind === "uploading" ? (
                  <Progress loaded={phase.loaded} total={phase.total} />
                ) : null
              }
            />
            <Step n="3" label="Konfirmasi" state={stepState(phase, "confirming")} />
          </ol>

          <Button type="submit" variant="primary" disabled={busy} className="mt-6 h-9 w-full">
            {busy ? <Spinner /> : null}
            {busy ? "Mengupload…" : "Upload & lanjut"}
          </Button>
          <p className="mt-2 text-[12px] text-ink-3">
            Jangan tutup tab ini sampai upload selesai. File dikirim langsung dari browser ke storage.
          </p>

          {phase.kind === "failed" ? (
            <div className="mt-5">
              <Notice tone="error" title="Upload gagal">
                <p>{phase.message}</p>
                {phase.id ? (
                  <p className="mt-1">
                    Draft sudah terbuat tanpa video.{" "}
                    <Link href={`/content/${phase.id}`} className="underline underline-offset-4">
                      Buka draft
                    </Link>{" "}
                    untuk menghapusnya, lalu coba lagi.
                  </p>
                ) : null}
              </Notice>
            </div>
          ) : null}
        </div>
      </aside>
    </form>
  );
}

type StepState = "todo" | "active" | "done";

const phaseOrder = ["idle", "creating", "uploading", "confirming"] as const;

function stepState(phase: Phase, step: "creating" | "uploading" | "confirming"): StepState {
  if (phase.kind === "failed") return "todo";
  const current = phaseOrder.indexOf(phase.kind);
  const target = phaseOrder.indexOf(step);
  if (current === target) return "active";
  return current > target ? "done" : "todo";
}

function Step({ n, label, state, detail }: { n: string; label: string; state: StepState; detail?: ReactNode }) {
  return (
    <li>
      <div className="flex items-center gap-3">
        <span
          className={`flex size-5 items-center justify-center font-mono text-[10px] ${
            state === "done" ? "bg-ink text-paper" : state === "active" ? "bg-rec text-paper" : "border border-rule-strong text-ink-3"
          }`}
        >
          {state === "done" ? "✓" : n}
        </span>
        <span className={state === "todo" ? "text-ink-2" : "text-ink"}>{label}</span>
        {state === "active" && !detail ? <Spinner className="ml-auto text-ink-3" /> : null}
      </div>
      {detail ? <div className="ml-8 mt-2">{detail}</div> : null}
    </li>
  );
}

function Progress({ loaded, total }: { loaded: number; total: number }) {
  const ratio = total > 0 ? Math.min(loaded / total, 1) : 0;
  return (
    <div>
      <div className="h-1 bg-sunk">
        <div className="h-full bg-rec transition-[width] duration-200" style={{ width: `${ratio * 100}%` }} />
      </div>
      <div className="mt-1 flex justify-between font-mono text-[11px] text-ink-2">
        <span>
          {formatBytes(loaded)} / {formatBytes(total)}
        </span>
        <span>{Math.round(ratio * 100)}%</span>
      </div>
    </div>
  );
}
