import "server-only";
import { randomUUID } from "node:crypto";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

const BUCKET = "blog-images";
const MAX_BYTES = 5 * 1024 * 1024;
const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export type UploadResult = { ok: true; url: string } | { ok: false; error: string };

/** Store an image in the public blog-images bucket and return its public URL. */
export async function uploadBlogImage(bytes: Uint8Array, contentType: string): Promise<UploadResult> {
  const ext = EXT[contentType];
  if (!ext) return { ok: false, error: "unsupported_type" };
  if (bytes.byteLength === 0) return { ok: false, error: "empty_file" };
  if (bytes.byteLength > MAX_BYTES) return { ok: false, error: "too_large" };

  const sb = getSupabaseAdminClient();
  if (!sb) return { ok: false, error: "server_error" };

  const path = `posts/${randomUUID()}.${ext}`;
  const { error } = await sb.storage.from(BUCKET).upload(path, bytes, {
    contentType,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) return { ok: false, error: error.message };

  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}

/**
 * Read an image from a request as either multipart/form-data (field "file") or
 * JSON { data_base64, content_type } (convenient for agents that build JSON).
 */
export async function readImageFromRequest(
  request: Request,
): Promise<{ bytes: Uint8Array; contentType: string } | { error: string }> {
  const ctype = request.headers.get("content-type") ?? "";

  if (ctype.includes("application/json")) {
    let body: { data_base64?: unknown; content_type?: unknown };
    try {
      body = await request.json();
    } catch {
      return { error: "invalid_json" };
    }
    const b64 = typeof body.data_base64 === "string" ? body.data_base64.replace(/^data:[^;]+;base64,/, "") : "";
    const contentType = typeof body.content_type === "string" ? body.content_type : "";
    if (!b64 || !contentType) return { error: "missing_image" };
    try {
      return { bytes: new Uint8Array(Buffer.from(b64, "base64")), contentType };
    } catch {
      return { error: "invalid_base64" };
    }
  }

  // multipart/form-data
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return { error: "missing_file" };
    const bytes = new Uint8Array(await file.arrayBuffer());
    return { bytes, contentType: file.type };
  } catch {
    return { error: "invalid_form" };
  }
}
