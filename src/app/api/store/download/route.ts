/**
 * GET /api/store/download?token=<download_token>[&type=ea|set|guide]
 *
 * Entitlement for a purchased vault EA. The token is minted only by the paid
 * Cryptomus webhook and never expires — the buyer paid once and keeps the
 * files, so the link in their e-mail must keep working. No login required.
 */
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { checkRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "ea-files";

export async function GET(request: NextRequest) {
  const limit = checkRateLimit({ key: rateLimitKey(request, "store:download"), limit: 30, windowMs: 60_000 });
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  const token = (request.nextUrl.searchParams.get("token") ?? "").trim();
  const type = (request.nextUrl.searchParams.get("type") ?? "ea") as "ea" | "set" | "guide";
  if (!/^[a-f0-9]{48}$/.test(token)) {
    return NextResponse.json({ error: "Link tải không hợp lệ." }, { status: 400 });
  }

  const sb = getSupabaseAdminClient();
  if (!sb) return NextResponse.json({ error: "server_config" }, { status: 500 });

  const { data: order } = await sb
    .from("vault_orders")
    .select("id, status, ea_id")
    .eq("download_token", token)
    .maybeSingle();

  if (!order || order.status !== "paid") {
    return NextResponse.json({ error: "Link tải không hợp lệ hoặc đơn chưa thanh toán." }, { status: 403 });
  }

  const { data: ea } = await sb
    .from("vault_eas")
    .select("storage_path, public_path, set_storage_path, guide_storage_path")
    .eq("id", order.ea_id)
    .maybeSingle();
  if (!ea) return NextResponse.json({ error: "EA không tồn tại." }, { status: 404 });

  const storagePath =
    type === "set" ? ea.set_storage_path : type === "guide" ? ea.guide_storage_path : ea.storage_path;
  const publicPath = type === "ea" ? ea.public_path : null;

  if (storagePath) {
    // Guide (HTML) is streamed through our origin: Supabase Storage serves
    // objects as text/plain under a sandboxed CSP, so a redirect would render
    // the raw source instead of the page. Same trick as /api/vault/download.
    if (type === "guide") {
      const { data: blob, error } = await sb.storage.from(BUCKET).download(storagePath);
      if (error || !blob) return NextResponse.json({ error: "Không tải được hướng dẫn." }, { status: 500 });
      return new NextResponse(await blob.arrayBuffer(), {
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, max-age=60" },
      });
    }
    const { data: signed, error } = await sb.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 120, { download: true });
    if (error || !signed) return NextResponse.json({ error: "Không tạo được link tải." }, { status: 500 });
    return NextResponse.redirect(signed.signedUrl);
  }
  if (publicPath) return NextResponse.redirect(new URL(publicPath, request.url));

  return NextResponse.json({ error: "EA này chưa có file." }, { status: 404 });
}
