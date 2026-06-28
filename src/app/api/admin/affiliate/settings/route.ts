/**
 * GET/POST /api/admin/affiliate/settings
 * Admin-only: read and update affiliate program settings.
 * Auth check: logged-in user must have admin role (user_id in ADMIN_IDS env var).
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getAffiliateSettings, invalidateAffiliateSettingsCache } from "@/lib/affiliate/settings";

const ADMIN_IDS = (process.env.AFFILIATE_ADMIN_IDS ?? "").split(",").filter(Boolean);

async function isAdmin(request: NextRequest): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); }, setAll() { } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    // If ADMIN_IDS is configured, check against it; otherwise first user is admin
    if (ADMIN_IDS.length > 0) return ADMIN_IDS.includes(user.id);
    return true; // No admin list configured = any logged-in user can access (dev mode)
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const settings = await getAffiliateSettings();
  return NextResponse.json({ settings });
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
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

    await supabase.from("affiliate_settings").update(updates).eq("id", 1);
    invalidateAffiliateSettingsCache();

    const settings = await getAffiliateSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("[Admin Affiliate Settings]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
