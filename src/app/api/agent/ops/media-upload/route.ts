/**
 * POST /api/agent/ops/media-upload
 *
 * Persistent media store for the agent company. Agents generate images/videos
 * (Pollinations, render pipeline, etc.) that would otherwise live only in a
 * throwaway URL or an ephemeral Paperclip workspace. This endpoint pulls the
 * asset into the public "Dralvo Storge" bucket, organised into folders, and
 * returns a stable public URL usable in ads, landing pages, Telegram, the bot.
 *
 * Auth: agent key with scope `ops:media`.
 *
 * Body (application/json), any one of:
 *   { source_url, filename?, folder? }              — server fetches the URL
 *   { data_base64, content_type, filename?, folder? } — inline bytes
 * Or multipart/form-data with field `file` (+ optional `filename`, `folder`).
 *
 * `folder` overrides the auto category (images/videos/audio/docs) — e.g.
 * "images/ads/vn". Returns: { ok, url, path, bucket }.
 */
import { NextResponse, type NextRequest } from "next/server";

import { verifyAgentKey } from "@/lib/agent/keys";
import { fetchRemoteAsset, uploadAgentMedia } from "@/lib/media/agent-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Parsed =
  | { bytes: Uint8Array; contentType: string; filename?: string; folder?: string }
  | { error: string };

async function parseBody(request: NextRequest): Promise<Parsed> {
  const ctype = request.headers.get("content-type") ?? "";

  if (ctype.includes("application/json")) {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return { error: "invalid_json" };
    }
    const filename = typeof body.filename === "string" ? body.filename : undefined;
    const folder = typeof body.folder === "string" ? body.folder : undefined;

    if (typeof body.source_url === "string" && body.source_url) {
      const got = await fetchRemoteAsset(body.source_url);
      if ("error" in got) return { error: got.error };
      return { ...got, filename, folder };
    }
    const b64 =
      typeof body.data_base64 === "string"
        ? body.data_base64.replace(/^data:[^;]+;base64,/, "")
        : "";
    const contentType = typeof body.content_type === "string" ? body.content_type : "";
    if (!b64 || !contentType) return { error: "missing_source" };
    try {
      return { bytes: new Uint8Array(Buffer.from(b64, "base64")), contentType, filename, folder };
    } catch {
      return { error: "invalid_base64" };
    }
  }

  // multipart/form-data
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return { error: "missing_file" };
    const filename =
      (typeof form.get("filename") === "string" ? (form.get("filename") as string) : "") ||
      file.name ||
      undefined;
    const folder = typeof form.get("folder") === "string" ? (form.get("folder") as string) : undefined;
    return {
      bytes: new Uint8Array(await file.arrayBuffer()),
      contentType: file.type,
      filename,
      folder,
    };
  } catch {
    return { error: "invalid_form" };
  }
}

export async function POST(request: NextRequest) {
  const key = await verifyAgentKey(request, "ops:media");
  if (!key) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = await parseBody(request);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const result = await uploadAgentMedia(parsed.bytes, parsed.contentType, {
    folder: parsed.folder,
    filename: parsed.filename,
  });
  if (!result.ok) {
    const status = result.error.startsWith("unsupported_type") || result.error === "too_large" ? 400 : 500;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json(result);
}
