/**
 * GET/POST /api/admin/tracking-settings — manage pixel settings.
 *   GET  ?scope=dralvo                 → Dralvo's settings (ids + raw snippets)
 *   GET  ?scope=partner&partnerId=...  → a partner's pixel ids
 *   POST { scope, partnerId?, ...ids, customHead?, customBody? }
 *
 * Super admin only. Pixel ids are validated/normalized; raw custom snippets are
 * accepted for the Dralvo scope ONLY (never for partners).
 */
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/admin/auth";
import { sanitizePixelIds } from "@/lib/marketing/tracking-settings";

const FORBIDDEN = { error: "Chỉ super admin mới cấu hình được pixel." };

function idsToColumns(input: Record<string, unknown>) {
  const ids = sanitizePixelIds(input);
  return {
    ga4_id: ids.ga4Id || null,
    google_ads_id: ids.googleAdsId || null,
    google_ads_purchase_label: ids.googleAdsPurchaseLabel || null,
    meta_pixel_id: ids.metaPixelId || null,
    tiktok_pixel_id: ids.tiktokPixelId || null,
  };
}

export async function GET(request: NextRequest) {
  const admin = await getAdmin();
  if (!admin || admin.role !== "super_admin") {
    return NextResponse.json(FORBIDDEN, { status: 403 });
  }
  const client = getSupabaseAdminClient();
  if (!client) return NextResponse.json({ error: "Server config" }, { status: 500 });

  const url = new URL(request.url);
  const scope = url.searchParams.get("scope") === "partner" ? "partner" : "dralvo";

  let query = client.from("tracking_settings").select("*").eq("scope", scope);
  if (scope === "partner") {
    const partnerId = url.searchParams.get("partnerId");
    if (!partnerId) return NextResponse.json({ error: "Thiếu partnerId." }, { status: 400 });
    query = query.eq("partner_id", partnerId);
  }
  const { data, error } = await query.maybeSingle();
  if (error) {
    console.error("[Admin Tracking] get", error);
    return NextResponse.json({ error: "Không tải được cấu hình." }, { status: 500 });
  }
  return NextResponse.json({ settings: data ?? null });
}

export async function POST(request: NextRequest) {
  const admin = await getAdmin();
  if (!admin || admin.role !== "super_admin") {
    return NextResponse.json(FORBIDDEN, { status: 403 });
  }
  const client = getSupabaseAdminClient();
  if (!client) return NextResponse.json({ error: "Server config" }, { status: 500 });

  try {
    const body = await request.json();
    const scope = body.scope === "partner" ? "partner" : "dralvo";

    const columns: Record<string, unknown> = {
      ...idsToColumns(body),
      updated_by: admin.user_id,
      updated_at: new Date().toISOString(),
    };

    if (scope === "dralvo") {
      // Raw snippets allowed only here (full HTML/<script> — GTM, Hotjar, …).
      // Injected client-side by MarketingPixels; never available to partners.
      columns.custom_head = typeof body.customHead === "string" ? body.customHead.slice(0, 8000) : null;
      columns.custom_body = typeof body.customBody === "string" ? body.customBody.slice(0, 8000) : null;
    }

    // Find the existing row (partial unique indexes → manual upsert).
    let findQuery = client.from("tracking_settings").select("id").eq("scope", scope);
    if (scope === "partner") {
      const partnerId = body.partnerId;
      if (!partnerId) return NextResponse.json({ error: "Thiếu partnerId." }, { status: 400 });
      // Make sure the partner exists.
      const { data: partner } = await client.from("partners").select("id").eq("id", partnerId).maybeSingle();
      if (!partner) return NextResponse.json({ error: "Không tìm thấy partner." }, { status: 404 });
      columns.partner_id = partnerId;
      findQuery = findQuery.eq("partner_id", partnerId);
    }
    const { data: existing } = await findQuery.maybeSingle();

    if (existing?.id) {
      const { error } = await client.from("tracking_settings").update(columns).eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await client.from("tracking_settings").insert({ scope, ...columns });
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[Admin Tracking] post", e);
    return NextResponse.json({ error: "Không lưu được cấu hình." }, { status: 500 });
  }
}
