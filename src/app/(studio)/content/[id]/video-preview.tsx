"use client";

import { useQuery } from "@tanstack/react-query";
import type { Ref } from "react";
import { Button, Spinner } from "@/components/ui";
import { api, errorMessage } from "@/lib/api/browser";
import { ApiError } from "@/lib/api/http";
import { timecode } from "@/lib/format";

type Props = {
  itemId: string;
  version: string | null;
  rendered: boolean;
  overlay: string | null;
  videoRef: Ref<HTMLVideoElement>;
  currentTime: number;
  duration: number | null;
  onTime: (seconds: number) => void;
  onDuration: (seconds: number) => void;
};

export function useVideoUrl(itemId: string, version: string | null) {
  return useQuery({
    queryKey: ["video-url", itemId, version],
    queryFn: async () => {
      try {
        return (await api<{ download_url: string }>(`/content-items/${itemId}/download-url`)).download_url;
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }
    },
    enabled: version !== null,
    staleTime: 4 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function VideoPreview({ itemId, version, rendered, overlay, videoRef, currentTime, duration, onTime, onDuration }: Props) {
  const url = useVideoUrl(itemId, version);

  return (
    <div>
      <div className="relative mx-auto flex aspect-[9/16] h-[55dvh] items-center lg:h-auto lg:max-h-[70dvh] lg:w-full justify-center overflow-hidden bg-ink text-paper">
        {version === null ? (
          <span className="px-6 text-center text-[13px] text-paper/60">Belum ada video untuk konten ini.</span>
        ) : url.isPending ? (
          <Spinner className="text-paper/50" />
        ) : url.isError ? (
          <div className="px-6 text-center">
            <p className="text-[13px] text-paper/80">Gagal mengambil URL video.</p>
            <p className="mt-1 font-mono text-[11px] text-paper/50">{errorMessage(url.error)}</p>
            <Button className="mt-3" onClick={() => url.refetch()}>
              Coba lagi
            </Button>
          </div>
        ) : url.data === null ? (
          <span className="px-6 text-center text-[13px] text-paper/60">File video belum tersedia di storage.</span>
        ) : (
          <>
            <video
              key={url.data}
              ref={videoRef}
              src={url.data}
              controls
              playsInline
              preload="metadata"
              onLoadedMetadata={(event) => onDuration(event.currentTarget.duration)}
              onTimeUpdate={(event) => onTime(event.currentTarget.currentTime)}
              onSeeked={(event) => onTime(event.currentTarget.currentTime)}
              onError={() => url.refetch()}
              className="h-full w-full object-contain"
            />
            {!rendered && overlay ? (
              <div className="pointer-events-none absolute inset-x-4 top-[62%] flex justify-center">
                <span className="max-w-full bg-paper px-2 py-1 text-center text-[15px] font-semibold leading-snug text-ink">
                  {overlay}
                </span>
              </div>
            ) : null}
          </>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-ink-2">
        <span className="uppercase tracking-[0.06em]">{rendered ? "Hasil render" : "Rekaman mentah"}</span>
        <span>
          {timecode(currentTime)} / {duration ? timecode(duration) : "--:--.-"}
        </span>
      </div>
      {!rendered && overlay !== null ? (
        <p className="mt-1 text-[11px] text-ink-3">Teks di atas video hanya pratinjau posisi & waktu, bukan hasil render.</p>
      ) : null}
    </div>
  );
}
