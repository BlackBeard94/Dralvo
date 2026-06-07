import { NextResponse } from "next/server";

import { indicatorSnapshots, type IndicatorSnapshot } from "@/data/indicators";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type IndicatorSnapshotRow = {
  indicator_key: string;
  value_json: unknown;
  observed_at: string;
};

function isIndicatorStatus(value: unknown): value is IndicatorSnapshot["status"] {
  return value === "bullish" || value === "neutral" || value === "bearish";
}

function isIndicatorSnapshot(value: unknown): value is IndicatorSnapshot {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.key === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.source === "string" &&
    typeof candidate.cadence === "string" &&
    typeof candidate.value === "string" &&
    typeof candidate.change === "string" &&
    isIndicatorStatus(candidate.status) &&
    typeof candidate.summary === "string" &&
    typeof candidate.observedAt === "string" &&
    typeof candidate.observedLabel === "string"
  );
}

function fallbackResponse(reason: string) {
  return NextResponse.json({
    ok: true,
    source: "fallback",
    reason,
    snapshots: indicatorSnapshots,
  });
}

export async function GET() {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return fallbackResponse("supabase-not-configured");
  }

  const { data, error } = await supabase
    .from("indicator_snapshots")
    .select("indicator_key,value_json,observed_at")
    .order("observed_at", { ascending: false })
    .limit(60);

  if (error) {
    console.error("[indicators] Supabase read error", JSON.stringify(error));
    return fallbackResponse("supabase-read-error");
  }

  const latestByKey = new Map<string, IndicatorSnapshot>();

  for (const row of (data ?? []) as IndicatorSnapshotRow[]) {
    if (latestByKey.has(row.indicator_key)) continue;
    if (isIndicatorSnapshot(row.value_json)) {
      latestByKey.set(row.indicator_key, row.value_json);
    }
  }

  if (latestByKey.size === 0) {
    return fallbackResponse("no-snapshots");
  }

  const snapshots = indicatorSnapshots.map(
    (fallback) => latestByKey.get(fallback.key) ?? fallback,
  );

  return NextResponse.json({
    ok: true,
    source: "supabase",
    snapshots,
  });
}
