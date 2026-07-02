/**
 * POST /api/affiliate/apply
 * Apply to become an affiliate partner. Requires auth.
 * Body: { displayName?: string }
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getAffiliateByUserId, generateReferralCode } from "@/lib/affiliate/server";
import { recordAdminEvent } from "@/lib/admin/events";

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

    // Check if already an affiliate
    const existing = await getAffiliateByUserId(user.id);
    if (existing) {
      return NextResponse.json({
        success: true,
        already: true,
        affiliate: { id: existing.id, code: existing.code, status: existing.status },
      });
    }

    const body = await request.json().catch(() => ({}));
    const { displayName } = body as { displayName?: string };

    const adminClient = getSupabaseAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const code = generateReferralCode(user.id);

    const { data, error } = await adminClient
      .from("affiliates")
      .insert({
        user_id: user.id,
        code,
        display_name: displayName ?? null,
        status: "pending", // requires admin approval
      })
      .select("*")
      .single();

    if (error) {
      // Duplicate code — extremely unlikely but handle gracefully
      if (error.code === "23505") {
        return NextResponse.json({ error: "You already applied or the code is taken" }, { status: 409 });
      }
      throw error;
    }

    await recordAdminEvent({
      type: "affiliate_signup",
      title: `Affiliate mới: ${user.email ?? user.id.slice(0, 8)}`,
      message: `Mã ${data.code} — đang chờ duyệt`,
      metadata: { userId: user.id, affiliateId: data.id, code: data.code },
    });

    return NextResponse.json({
      success: true,
      affiliate: { id: data.id, code: data.code, status: data.status },
    });
  } catch (error) {
    console.error("[Affiliate Apply]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
