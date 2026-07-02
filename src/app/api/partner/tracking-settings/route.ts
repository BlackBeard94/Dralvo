/**
 * GET/POST /api/partner/tracking-settings — a partner manages THEIR OWN pixel
 * ids. Ids only — partners can never set raw tracking code (that would run on
 * dralvo.com for their referred visitors). Ids are validated/normalized.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getPartner } from "@/lib/partners/auth";
import { sanitizePixelIds } from "@/lib/marketing/tracking-settings";

export async function GET() {
  const partner = await getPartner();
  if (!partner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = getSupabaseAdminClient();
  if (!client) return NextResponse.json({ error: "Server config" }, { status: 500 });

  const { data, error } = await client
    .from("tracking_settings")
    .select("*")
    .eq("scope", "partner")
    .eq("partner_id", partner.id)
    .maybeSingle();
  if (error) {
    console.error("[Partner Tracking] get", error);
    return NextResponse.json({ error: "Không tải được cấu hình." }, { status: 500 });
  }
  return NextResponse.json({ settings: data ?? null });
}

export async function POST(request: NextRequest) {
  const partner = await getPartner();
  if (!partner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = getSupabaseAdminClient();
  if (!client) return NextResponse.json({ error: "Server config" }, { status: 500 });

  try {
    const body = await request.json();
    const ids = sanitizePixelIds(body);
    const columns = {
      partner_id: partner.id,
      ga4_id: ids.ga4Id || null,
      google_ads_id: ids.googleAdsId || null,
      google_ads_purchase_label: ids.googleAdsPurchaseLabel || null,
      meta_pixel_id: ids.metaPixelId || null,
      tiktok_pixel_id: ids.tiktokPixelId || null,
      updated_by: partner.user_id,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await client
      .from("tracking_settings")
      .select("id")
      .eq("scope", "partner")
      .eq("partner_id", partner.id)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await client.from("tracking_settings").update(columns).eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await client.from("tracking_settings").insert({ scope: "partner", ...columns });
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[Partner Tracking] post", e);
    return NextResponse.json({ error: "Không lưu được cấu hình." }, { status: 500 });
  }
}
