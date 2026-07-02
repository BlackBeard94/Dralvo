/**
 * POST /api/affiliate/convert
 * Called after user signup to convert their referral click into a tracked conversion.
 * Requires auth. Reads visitorId from request body and links it to the authenticated user.
 * Body: { visitorId: string }
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { convertReferral } from "@/lib/affiliate/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
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

    const body = await request.json().catch(() => ({}));
    const { visitorId } = body as { visitorId?: string };

    if (!visitorId) {
      return NextResponse.json({ converted: false, error: "Missing visitorId" });
    }

    const referral = await convertReferral(visitorId, user.id);

    // Single-owner attribution (affiliate XOR partner): stamp this customer as
    // affiliate-owned ONLY if no referrer is set yet — first touch wins, the
    // partner side won't double-claim. Source of truth: profiles.referrer_type.
    if (referral?.affiliate_id) {
      const admin = getSupabaseAdminClient();
      if (admin) {
        await admin
          .from("profiles")
          .update({ referrer_type: "affiliate", referrer_id: referral.affiliate_id })
          .eq("id", user.id)
          .is("referrer_type", null);
      }
    }

    return NextResponse.json({
      converted: !!referral,
      affiliateCode: referral ? null : null, // Don't expose which affiliate
    });
  } catch (error) {
    console.error("[Affiliate Convert]", error);
    return NextResponse.json({ converted: false, error: "Internal error" });
  }
}
