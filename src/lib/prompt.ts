import type { ContentItem } from "@/lib/api/types";
import { findProduct } from "@/lib/products";

type PromptInput = {
  item: ContentItem;
  durationSeconds: number | null;
  direction: string;
};

export function buildPrompt({ item, durationSeconds, direction }: PromptInput): string {
  const product = findProduct(item.product);
  const length = durationSeconds ? Math.floor(durationSeconds * 10) / 10 : null;

  const lines = [
    "You write short-form social video copy (Instagram Reels, TikTok, Facebook) for an indie app developer.",
    "",
    "## Product",
    `Name: ${product?.name ?? item.product}`,
    product ? `What it does: ${product.pitch}` : null,
    product ? `Audience: ${product.audience}` : null,
    "",
    "## This video",
    `Working title: ${item.title}`,
    `Brief: ${item.brief}`,
    length
      ? `The footage is a raw screen recording, ${length} seconds long. Text overlays are burned on top of it.`
      : "The footage is a raw screen recording of unknown length; assume about 15 seconds.",
    direction.trim() ? `Extra direction from the creator: ${direction.trim()}` : null,
    "",
    "## Write",
    `Language: ${product?.language ?? "Bahasa Indonesia santai"}. Sound like a person, not an ad agency. No emoji in the script beats.`,
    "1. caption: 1-3 sentences for the post, then 3-6 relevant hashtags on the same string. Platform-agnostic.",
    "2. script: on-screen text overlays in order.",
    "   - Beat 1 is the hook: under 8 words, starts at 0, stops the scroll.",
    "   - Then 2-4 supporting beats that match what a viewer would see in a screen recording of this app.",
    "   - Last beat is the call to action.",
    "   - Each overlay must be readable in its duration (roughly 3 words per second, minimum 1.5 seconds).",
    "   - Beats must not overlap." + (length ? ` The last beat must end at or before ${length} seconds.` : ""),
    "",
    "## Output format",
    "Reply with ONLY a JSON object, no markdown fences, no commentary, exactly this shape:",
    '{"caption": string, "script": [{"text": string, "start_seconds": number, "duration_seconds": number}]}',
  ];

  return lines.filter((line) => line !== null).join("\n");
}
