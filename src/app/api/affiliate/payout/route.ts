/**
 * POST /api/affiliate/payout — logged-in affiliate requests a withdrawal.
 * GET  /api/affiliate/payout — returns the affiliate's current open payout (if any).
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getAffiliateByUserId, getOpenPayout, createPayoutRequest } from "@/lib/affiliate/server";
import { validatePayoutMethod } from "@/lib/affiliate/payout-options";

async function getUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const affiliate = await getAffiliateByUserId(user.id);
    if (!affiliate) return NextResponse.json({ error: "Not an affiliate" }, { status: 404 });

    const payout = await getOpenPayout(affiliate.id);
    return NextResponse.json({ payout });
  } catch (error) {
    console.error("[Affiliate Payout GET]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

const ERROR_STATUS: Record<string, number> = {
  not_active: 403,
  below_minimum: 400,
  already_requested: 409,
  server_error: 500,
};

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const affiliate = await getAffiliateByUserId(user.id);
    if (!affiliate) return NextResponse.json({ error: "Not an affiliate" }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const method = validatePayoutMethod((body as { method?: unknown }).method);
    if (!method.ok) {
      return NextResponse.json({ error: method.error }, { status: 400 });
    }

    const result = await createPayoutRequest(affiliate, method.value);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: ERROR_STATUS[result.error] ?? 400 });
    }

    return NextResponse.json({ success: true, payout: result.payout });
  } catch (error) {
    console.error("[Affiliate Payout POST]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
