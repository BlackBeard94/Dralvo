/**
 * GET /api/affiliate/stats
 * Returns stats + commissions list for the logged-in affiliate.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getAffiliateByUserId, getAffiliateStats } from "@/lib/affiliate/server";
import type { AffiliateCommission } from "@/lib/affiliate/types";

export async function GET(request: NextRequest) {
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

    const stats = await getAffiliateStats(affiliate.id);

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
      referralUrl: `https://www.dralvo.com?ref=${affiliate.code}`,
    });
  } catch (error) {
    console.error("[Affiliate Stats]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
