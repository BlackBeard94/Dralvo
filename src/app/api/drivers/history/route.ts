import { NextResponse } from "next/server";

import { summarizeDriverHistory } from "@/lib/driver-history";
import { checkRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getUserPlanTierByUserId } from "@/lib/subscription-gate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const NO_STORE_HEADERS = { "Cache-Control": "private, no-store, max-age=0" };

const DRIVER_SERIES = {
  "cftc-gold-positioning": {
    seriesKey: "managed_money_net",
    freeLimit: 12,
    proLimit: 1_000,
  },
  "gld-gold-holdings": {
    seriesKey: "gld_tonnes",
    freeLimit: 30,
    proLimit: 1_000,
  },
  "tips-real-yield": {
    seriesKey: "dfii10_yield_percent",
    freeLimit: 30,
    proLimit: 1_000,
  },
  "xauusd-price-context": {
    seriesKey: "xauusd_close_usd",
    freeLimit: 30,
    proLimit: 1_000,
  },
} as const;

export async function GET(request: Request) {
  const rateLimit = checkRateLimit({
    key: rateLimitKey(request, "drivers:history:get"),
    limit: 60,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.resetAt);

  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const driverKey = url.searchParams.get("driver") ?? "";
  const config = DRIVER_SERIES[driverKey as keyof typeof DRIVER_SERIES];
  if (!config) {
    return NextResponse.json({ error: "Unsupported driver" }, { status: 400 });
  }

  const tier = await getUserPlanTierByUserId(user.id);
  const limit = tier === "Pro" ? config.proLimit : config.freeLimit;
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Evidence store unavailable" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("evidence_observations")
    .select("observed_at,numeric_value,unit,source_url")
    .eq("driver_key", driverKey)
    .eq("series_key", config.seriesKey)
    .order("observed_at", { ascending: false })
    .limit(limit);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  const rows = (data ?? []).reverse();
  const points = rows.map((row) => ({
    observedAt: row.observed_at,
    value: row.numeric_value,
  }));
  const summary = summarizeDriverHistory(points);

  return NextResponse.json(
    {
      driverKey,
      seriesKey: config.seriesKey,
      unit: rows.at(-1)?.unit ?? "contracts",
      sourceUrl: rows.at(-1)?.source_url ?? null,
      planTier: tier,
      limited: tier !== "Pro",
      windowLimit: limit,
      points,
      summary,
    },
    { headers: NO_STORE_HEADERS },
  );
}
