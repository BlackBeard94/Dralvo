/**
 * GET/POST /api/admin/affiliate/settings
 * Admin-only: read and update affiliate program settings.
 * Auth: shared role-based admin guard (getAdmin + can) — fails closed.
 */
import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getAdmin, can } from "@/lib/admin/auth";
import { getAffiliateSettings, invalidateAffiliateSettingsCache } from "@/lib/affiliate/settings";

export async function GET() {
  const admin = await getAdmin();
  if (!admin || !can(admin, "affiliate.manage")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const settings = await getAffiliateSettings();
  return NextResponse.json({ settings });
}

export async function POST(request: Request) {
  const admin = await getAdmin();
  if (!admin || !can(admin, "affiliate.manage")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { commission_rate, cookie_days, min_payout, program_active } = body;

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof commission_rate === "number") updates.commission_rate = commission_rate;
    if (typeof cookie_days === "number") updates.cookie_days = cookie_days;
    if (typeof min_payout === "number") updates.min_payout = min_payout;
    if (typeof program_active === "boolean") updates.program_active = program_active;

    const { error } = await supabase.from("affiliate_settings").update(updates).eq("id", 1);
    if (error) {
      return NextResponse.json({ error: "Could not save settings" }, { status: 500 });
    }
    invalidateAffiliateSettingsCache();

    const settings = await getAffiliateSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("[Admin Affiliate Settings]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
