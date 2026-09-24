export type ContentStatus = "draft" | "generating" | "ready_to_render" | "rendering" | "ready" | "failed";

export type ScriptBeat = {
  text: string;
  start_seconds: number;
  duration_seconds: number;
};

export type ContentItem = {
  id: string;
  product: string;
  title: string;
  brief: string;
  raw_video_key?: string | null;
  status: ContentStatus;
  caption?: string | null;
  script?: ScriptBeat[] | null;
  rendered_video_key?: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateContentResponse = {
  id: string;
  upload_url: string;
};

export type RenderStatus = "queued" | "rendering" | "done" | "failed";

export type RenderJob = {
  id: string;
  content_item_id: string;
  status: RenderStatus;
  error?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  created_at: string;
};

export type AiProvider = "claude" | "openai" | "gemini";

export type AdPlatform = "instagram" | "facebook";

export type AdEntry = {
  id: string;
  content_item_id?: string | null;
  platform: AdPlatform;
  external_ad_id?: string | null;
  spend: number;
  started_at: string;
  created_at: string;
};

export type AdMetric = {
  id: string;
  ad_entry_id: string;
  date: string;
  impressions: number;
  reach: number;
  clicks: number;
  spend: number;
  created_at: string;
};

export type SyncResult = {
  synced: number;
  total: number;
};
