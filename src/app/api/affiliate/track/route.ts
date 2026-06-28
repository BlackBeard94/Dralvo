/**
 * POST /api/affiliate/track
 * Record a referral click. Called from middleware or client-side on landing page load.
 * Body: { code: string, visitorId: string }
 * Sets a cookie 'dralvo_ref' with the affiliate code.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getAffiliateByCode, trackReferralClick } from "@/lib/affiliate/server";
import { getAffiliateSettings } from "@/lib/affiliate/settings";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { code, visitorId } = body as { code?: string; visitorId?: string };

    if (!code || !visitorId) {
      return NextResponse.json({ tracked: false, error: "Missing code or visitorId" }, { status: 400 });
    }

    const affiliate = await getAffiliateByCode(code.toUpperCase());
    if (!affiliate) {
      return NextResponse.json({ tracked: false, error: "Invalid referral code" });
    }

    const settings = await getAffiliateSettings();
    if (!settings.program_active) {
      return NextResponse.json({ tracked: false, error: "Program inactive" });
    }

    const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? null;
    const ua = request.headers.get("user-agent") ?? null;
    const landing = request.headers.get("referer") ?? null;

    await trackReferralClick(affiliate.id, visitorId, ip, ua, landing);

    const response = NextResponse.json({ tracked: true, code: affiliate.code });
    response.cookies.set("dralvo_ref", `${code}:${visitorId}`, {
      maxAge: settings.cookie_days * 24 * 60 * 60,
      path: "/",
      httpOnly: false,
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("[Affiliate Track]", error);
    return NextResponse.json({ tracked: false, error: "Internal error" }, { status: 500 });
  }
}
