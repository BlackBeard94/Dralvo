/**
 * GET /api/affiliate/stats
 * Returns stats + commissions list for the logged-in affiliate.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getAffiliateByUserId, getAffiliateStats, getOpenPayout } from "@/lib/affiliate/server";
import { getAffiliateSettings } from "@/lib/affiliate/settings";
import type { AffiliateCommission } from "@/lib/affiliate/types";

export async function GET(_request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); }, setAll() { } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const affiliate = await getAffiliateByUserId(user.id);
    if (!affiliate) {
      return NextResponse.json({ error: "Not an affiliate" }, { status: 404 });
    }

    const [stats, openPayout, settings] = await Promise.all([
      getAffiliateStats(affiliate.id),
      getOpenPayout(affiliate.id),
      getAffiliateSettings(),
    ]);

    // Also fetch recent commissions
    const adminClient = getSupabaseAdminClient();
    let commissions: AffiliateCommission[] = [];
    if (adminClient) {
      const { data } = await adminClient
        .from("affiliate_commissions")
        .select("*")
        .eq("affiliate_id", affiliate.id)
        .order("created_at", { ascending: false })
        .limit(50);
      commissions = (data ?? []) as AffiliateCommission[];
    }

    return NextResponse.json({
      affiliate: {
        id: affiliate.id,
        code: affiliate.code,
        status: affiliate.status,
        display_name: affiliate.display_name,
        created_at: affiliate.created_at,
      },
      stats,
      commissions,
      openPayout,
      minPayout: settings.min_payout,
      referralUrl: `${(process.env.NEXT_PUBLIC_SITE_URL || "https://www.dralvo.com").replace(/\/$/, "")}/?ref=${affiliate.code}`,
    });
  } catch (error) {
    console.error("[Affiliate Stats]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
