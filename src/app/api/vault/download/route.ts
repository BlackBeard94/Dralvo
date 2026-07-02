/**
 * GET /api/vault/download?id=<eaId>
 * VIP-gated EA download. Verifies the caller holds an active VIP (unlimited)
 * license, then redirects to a short-lived signed URL (storage) or the legacy
 * public path.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";

const BUCKET = "ea-files";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const type = (url.searchParams.get("type") ?? "ea") as "ea" | "set" | "guide";
  if (!id) return NextResponse.json({ error: "Thiếu id" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Server config" }, { status: 500 });

  const { data: ea } = await admin
    .from("vault_eas")
    .select("enabled, requires_license, storage_path, public_path, set_storage_path, guide_storage_path")
    .eq("id", id)
    .maybeSingle();
  if (!ea || !ea.enabled) return NextResponse.json({ error: "EA không khả dụng" }, { status: 404 });

  // VIP gate — same rule as the Kho EA page. Skipped for EAs explicitly
  // marked free (requires_license = false); logging in is still required.
  if (ea.requires_license) {
    const { data: lic } = await admin
      .from("license_keys")
      .select("expires_at")
      .eq("user_id", user.id)
      .eq("plan", "unlimited")
      .order("expires_at", { ascending: false, nullsFirst: true })
      .limit(1);
    const hasAccess = !!lic?.[0] && (!lic[0].expires_at || new Date(lic[0].expires_at) > new Date());
    if (!hasAccess) return NextResponse.json({ error: "Cần gói VIP để tải EA" }, { status: 403 });
  }

  // Pick the requested file slot.
  const storagePath = type === "set" ? ea.set_storage_path : type === "guide" ? ea.guide_storage_path : ea.storage_path;
  const publicPath = type === "ea" ? ea.public_path : null;

  if (storagePath) {
    // Guide (HTML) is proxied through this route instead of redirected to the
    // Supabase signed URL: Supabase Storage always serves objects as
    // "Content-Type: text/plain" with a sandboxed CSP (a deliberate anti-XSS
    // guardrail, not configurable per-bucket) — so a redirect would show raw
    // HTML source as plain text instead of a rendered page. Streaming the
    // bytes ourselves lets us set the real content-type on our own origin.
    if (type === "guide") {
      const { data: blob, error } = await admin.storage.from(BUCKET).download(storagePath);
      if (error || !blob) return NextResponse.json({ error: "Không tải được hướng dẫn" }, { status: 500 });
      return new NextResponse(await blob.arrayBuffer(), {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "private, max-age=60",
        },
      });
    }
    // Binary EA/set files: redirect to a short-lived signed URL that forces
    // save-as, so the large file streams directly from storage (not proxied).
    const { data: signed, error } = await admin.storage.from(BUCKET).createSignedUrl(storagePath, 60, { download: true });
    if (error || !signed) return NextResponse.json({ error: "Không tạo được link tải" }, { status: 500 });
    return NextResponse.redirect(signed.signedUrl);
  }
  if (publicPath) {
    return NextResponse.redirect(new URL(publicPath, request.url));
  }
  return NextResponse.json({ error: "Chưa có file" }, { status: 404 });
}
