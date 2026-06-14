import { NextResponse } from "next/server";

import { IMPLEMENTED_DRIVER_SOURCE_REGISTRY } from "@/data/driver-registry";
import {
  buildGoldThesis,
  type EvidenceRow,
} from "@/lib/intelligence/gold-thesis";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      "driver_key,series_key,numeric_value,unit,observed_at,source_url,quality",
    )
    .in(
      "driver_key",
      IMPLEMENTED_DRIVER_SOURCE_REGISTRY.map((driver) => driver.driverKey),
    )
    .order("observed_at", { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    thesis: buildGoldThesis((data ?? []) as EvidenceRow[]),
  });
}
