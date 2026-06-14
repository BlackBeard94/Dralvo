import { NextRequest, NextResponse } from "next/server";

import { IMPLEMENTED_DRIVER_SOURCE_REGISTRY } from "@/data/driver-registry";
import { buildGoldThesis } from "@/lib/intelligence/gold-thesis";
import {
  evidenceAvailableBy,
  replayCutoff,
  type ReplayEvidenceRow,
} from "@/lib/intelligence/replay";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getUserPlanTierByUserId } from "@/lib/subscription-gate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tier = await getUserPlanTierByUserId(user.id);
  if (tier !== "Pro") {
    return NextResponse.json(
      { error: "Historical thesis replay requires Dralvo Pro." },
      { status: 403 },
    );
  }

  const date = request.nextUrl.searchParams.get("date") ?? "";
  const cutoff = replayCutoff(date);
  if (!cutoff || cutoff.getTime() > Date.now()) {
    return NextResponse.json(
      { error: "Provide a valid historical date in YYYY-MM-DD format." },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Evidence store is not configured" },
      { status: 503 },
    );
  }

  const { data, error } = await supabase
    .from("evidence_observations")
    .select(
      "driver_key,series_key,numeric_value,unit,observed_at,released_at,retrieved_at,source_url,quality",
    )
    .in(
      "driver_key",
      IMPLEMENTED_DRIVER_SOURCE_REGISTRY.map((driver) => driver.driverKey),
    )
    .lte("observed_at", cutoff.toISOString())
    .order("observed_at", { ascending: false })
    .limit(2000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  const availableEvidence = evidenceAvailableBy(
    (data ?? []) as ReplayEvidenceRow[],
    cutoff,
  );

  return NextResponse.json({
    ok: true,
    asOf: cutoff.toISOString(),
    evidenceCount: availableEvidence.length,
    thesis: buildGoldThesis(availableEvidence, cutoff),
    availabilityRule:
      "Uses released_at when provided; otherwise retrieved_at must be at or before the replay cutoff.",
  });
}
