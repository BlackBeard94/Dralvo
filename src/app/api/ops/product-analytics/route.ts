import { NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/admin";
import { buildProductAnalyticsSummary } from "@/lib/product-analytics";
import { checkRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const rateLimit = checkRateLimit({
    key: rateLimitKey(request, "ops:product-analytics:get"),
    limit: 30,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.resetAt);

  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  const eventLimit = 50_000;
  const { data, error } = await supabase
    .from("product_events")
    .select("user_id,event_name,route_path,occurred_at")
    .order("occurred_at", { ascending: false })
    .limit(eventLimit);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    event_limit: eventLimit,
    potentially_truncated: (data?.length ?? 0) === eventLimit,
    summary: buildProductAnalyticsSummary(data ?? []),
  });
}
