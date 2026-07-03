import "server-only";
import { randomUUID } from "node:crypto";

import { getSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * Agent media store — persistent library for images/videos/audio the agent
 * company produces. Files land in the public "Dralvo Storge" bucket, organised
 * into top-level folders (images/, videos/, audio/, docs/) so they stay tidy
 * and get a stable public URL usable in ads, landing pages, Telegram, etc.
 */

export const MEDIA_BUCKET = "Dralvo Storge";

// contentType -> [extension, category folder]
const TYPES: Record<string, [string, string]> = {
  "image/png": ["png", "images"],
  "image/jpeg": ["jpg", "images"],
  "image/webp": ["webp", "images"],
  "image/gif": ["gif", "images"],
  "image/avif": ["avif", "images"],
  "image/svg+xml": ["svg", "images"],
  "video/mp4": ["mp4", "videos"],
  "video/webm": ["webm", "videos"],
  "video/quicktime": ["mov", "videos"],
  "audio/mpeg": ["mp3", "audio"],
  "audio/wav": ["wav", "audio"],
  "audio/ogg": ["ogg", "audio"],
  "application/pdf": ["pdf", "docs"],
  "application/zip": ["zip", "docs"],
};

const MAX_BYTES = 250 * 1024 * 1024; // 250 MB — generous for short video creatives

export type MediaUploadResult =
  | { ok: true; url: string; path: string; bucket: string }
  | { ok: false; error: string };

/** Turn a human filename into a safe, short slug for the object path. */
function slug(name: string | undefined): string {
  if (!name) return "";
  const base = name.replace(/\.[a-z0-9]+$/i, "");
  const s = base
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return s ? `${s}-` : "";
}

/**
 * Upload raw bytes to the media bucket. `folder` overrides the auto category
 * (e.g. "images/ads"); otherwise the folder is derived from the content type.
 */
export async function uploadAgentMedia(
  bytes: Uint8Array,
  contentType: string,
  opts: { folder?: string; filename?: string } = {},
): Promise<MediaUploadResult> {
  const meta = TYPES[contentType];
  if (!meta) return { ok: false, error: `unsupported_type:${contentType || "unknown"}` };
  if (bytes.byteLength === 0) return { ok: false, error: "empty_file" };
  if (bytes.byteLength > MAX_BYTES) return { ok: false, error: "too_large" };

  const [ext, category] = meta;
  const folder = (opts.folder || category)
    .replace(/^\/+|\/+$/g, "")
    .replace(/[^a-zA-Z0-9/_-]+/g, "");
  const path = `${folder}/${slug(opts.filename)}${randomUUID()}.${ext}`;

  const sb = getSupabaseAdminClient();
  if (!sb) return { ok: false, error: "server_config" };

  const { error } = await sb.storage.from(MEDIA_BUCKET).upload(path, bytes, {
    contentType,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) return { ok: false, error: error.message };

  const { data } = sb.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl, path, bucket: MEDIA_BUCKET };
}

/** Fetch a remote asset (e.g. a Pollinations image URL) into memory, with limits. */
export async function fetchRemoteAsset(
  sourceUrl: string,
): Promise<{ bytes: Uint8Array; contentType: string } | { error: string }> {
  let u: URL;
  try {
    u = new URL(sourceUrl);
  } catch {
    return { error: "bad_source_url" };
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return { error: "bad_scheme" };

  let res: Response;
  try {
    res = await fetch(u, { redirect: "follow", signal: AbortSignal.timeout(60_000) });
  } catch (e) {
    return { error: `fetch_failed:${e instanceof Error ? e.message : "unknown"}` };
  }
  if (!res.ok) return { error: `source_status_${res.status}` };

  const contentType = (res.headers.get("content-type") ?? "").split(";")[0].trim();
  const len = Number(res.headers.get("content-length") ?? 0);
  if (len && len > MAX_BYTES) return { error: "too_large" };

  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.byteLength > MAX_BYTES) return { error: "too_large" };
  return { bytes: buf, contentType };
}
