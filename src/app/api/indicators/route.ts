import { NextRequest, NextResponse } from "next/server";

import {
  type IndicatorHistoryPoint,
  type IndicatorSnapshot,
} from "@/data/indicators";
import { INDICATOR_KEYS } from "@/data/ingestion";
import { extractIndicatorNumericValue } from "@/lib/indicator-values";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getUserPlanTierByUserId } from "@/lib/subscription-gate";

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
    ok: false,
    source: "unavailable",
    reason,
    snapshots: [],
    history: {},
  }, { status: 503 });
}

export function buildIndicatorHistory(rows: IndicatorSnapshotRow[]) {
  const history = new Map<string, IndicatorHistoryPoint[]>();

  for (const row of rows) {
    if (!isIndicatorSnapshot(row.value_json)) continue;

    const numericValue = extractIndicatorNumericValue(row.value_json);
    if (numericValue === null) continue;

    const points = history.get(row.indicator_key) ?? [];
    if (points.length >= 60) continue;

    points.push({
      observedAt: row.observed_at,
      value: numericValue,
    });
    history.set(row.indicator_key, points);
  }

  return Object.fromEntries(
    [...history.entries()].map(([key, points]) => [
      key,
      points.reverse(),
    ]),
  ) as Record<string, IndicatorHistoryPoint[]>;
}

function parseRequestedCount(value: string | null, fallback: number) {
  if (!value) return fallback;

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;

  return Math.max(1, Math.min(parsed, fallback));
}

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return fallbackResponse("supabase-not-configured");
  }

  const { data, error } = await supabase
    .from("indicator_snapshots")
    .select("indicator_key,value_json,observed_at")
    .order("observed_at", { ascending: false })
    .limit(360);

  if (error) {
    console.error("[indicators] Supabase read error", JSON.stringify(error));
    return fallbackResponse("supabase-read-error");
  }

  const latestByKey = new Map<string, IndicatorSnapshot>();
  const rows = (data ?? []) as IndicatorSnapshotRow[];

  for (const row of rows) {
    if (latestByKey.has(row.indicator_key)) continue;
    if (isIndicatorSnapshot(row.value_json)) {
      latestByKey.set(row.indicator_key, row.value_json);
    }
  }

  if (latestByKey.size === 0) {
    return fallbackResponse("no-snapshots");
  }

  const snapshots = INDICATOR_KEYS
    .map((key) => latestByKey.get(key))
    .filter((snapshot): snapshot is IndicatorSnapshot => Boolean(snapshot));
  const { searchParams } = new URL(request.url);
  const requestedCount = parseRequestedCount(searchParams.get("count"), snapshots.length);

  let tier: "Free" | "Pro" = "Free";
  try {
    tier = await getUserPlanTierByUserId(user.id);
  } catch (error) {
    console.error("[indicators] Plan tier lookup failed", error);
  }

  const visibleCount = tier === "Pro" ? requestedCount : Math.min(requestedCount, 3);
  const limitedSnapshots = snapshots.slice(0, visibleCount);
  const visibleKeys = new Set(limitedSnapshots.map((snapshot) => snapshot.key));
  const allHistory = buildIndicatorHistory(rows);
  const history = Object.fromEntries(
    Object.entries(allHistory).filter(([key]) => visibleKeys.has(key)),
  );
  const planLimit = tier !== "Pro" && requestedCount > visibleCount;

  return NextResponse.json({
    ok: true,
    source: "supabase",
    snapshots: limitedSnapshots,
    history,
    plan_limit: planLimit || undefined,
  });
}
