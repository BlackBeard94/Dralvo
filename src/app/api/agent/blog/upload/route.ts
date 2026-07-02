/**
 * POST /api/agent/blog/upload — an external agent uploads an image (multipart
 * "file", or JSON { data_base64, content_type }) and gets back a public URL to
 * use as cover_image_url or in the article Markdown. Bearer-key authenticated.
 */
import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";
import { verifyBlogAgent } from "@/lib/agent/keys";
import { readImageFromRequest, uploadBlogImage } from "@/lib/blog/upload";

export async function POST(request: NextRequest) {
  const rl = checkRateLimit({ key: rateLimitKey(request, "agent:blog:upload"), limit: 30, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);
  if (!(await verifyBlogAgent(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const img = await readImageFromRequest(request);
  if ("error" in img) return NextResponse.json({ error: img.error }, { status: 400 });

  const result = await uploadBlogImage(img.bytes, img.contentType);
  if (!result.ok) {
    const code = result.error === "too_large" || result.error === "unsupported_type" ? 400 : 500;
    return NextResponse.json({ error: result.error }, { status: code });
  }
  return NextResponse.json({ success: true, url: result.url });
}
