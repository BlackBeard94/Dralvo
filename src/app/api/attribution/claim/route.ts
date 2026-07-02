/**
 * POST /api/attribution/claim
 * Claims partner (reseller) attribution for the authenticated user on first
 * touch. Sets profiles.referrer_type='partner', referrer_id=<partner.id> ONLY
 * if the user has no referrer yet. If a referrer (affiliate or partner) is
 * already set, this is a no-op ("đến trước thì bên đó ăn").
 *
 * Body: { code: string }  — the partner code from the dralvo_partner cookie.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
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
    const { code } = body as { code?: string };
    if (!code) {
      return NextResponse.json({ claimed: false, error: "Missing code" });
    }

    const admin = getSupabaseAdminClient();
    if (!admin) {
      return NextResponse.json({ claimed: false, error: "Server configuration error" });
    }

    // First-touch guard: if the user already has a referrer (either kind), stop.
    const { data: profile } = await admin
      .from("profiles")
      .select("referrer_type, referrer_id")
      .eq("id", user.id)
      .single();

    if (profile?.referrer_type) {
      return NextResponse.json({ claimed: false }); // already owned — no-op
    }

    // Resolve the active partner by code.
    const { data: partner } = await admin
      .from("partners")
      .select("id")
      .eq("code", code)
      .eq("status", "active")
      .single();

    if (!partner) {
      return NextResponse.json({ claimed: false });
    }

    // Set ownership ONLY where referrer_type is still null (race guard).
    await admin
      .from("profiles")
      .update({ referrer_type: "partner", referrer_id: partner.id })
      .eq("id", user.id)
      .is("referrer_type", null);

    return NextResponse.json({ claimed: true });
  } catch (error) {
    console.error("[Attribution Claim]", error);
    return NextResponse.json({ claimed: false, error: "Internal error" });
  }
}
