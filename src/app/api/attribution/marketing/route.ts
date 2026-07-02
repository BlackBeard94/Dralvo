import { NextResponse } from "next/server";

import { upsertMarketingAttribution } from "@/lib/marketing/attribution";
import { checkRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";
import { getAuthenticatedUser } from "@/lib/supabase/auth";

/**
 * Persists the captured ad touch (UTM + click-ids + Meta cookies) onto the
 * authenticated user's marketing_attribution row. No-ops for anonymous callers
 * so the client claim component can fire unconditionally.
 */
export async function POST(request: Request) {
  const rateLimit = checkRateLimit({
    key: rateLimitKey(request, "attribution:marketing:post"),
    limit: 30,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.resetAt);

  const user = await getAuthenticatedUser();
  if (!user) {
    // Anonymous: silently accept so the client doesn't retry/log noise.
    return NextResponse.json({ recorded: false }, { status: 202 });
  }

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const recorded = await upsertMarketingAttribution(user.id, body);
  return NextResponse.json({ recorded }, { status: recorded ? 201 : 200 });
}
