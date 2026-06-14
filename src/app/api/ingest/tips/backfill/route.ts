import { NextRequest, NextResponse } from "next/server";

import {
  buildFredTipsHistoricalObservations,
  buildFredTipsHistoricalUrl,
  FRED_DFII10_SOURCE_URL,
  validateFredTipsHistoricalYear,
} from "@/data/ingestion/fetchers/tips-yields";
import { isCronAuthorized } from "@/lib/api-auth";
import { recordRunLog } from "@/lib/run-logs";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const NO_STORE_HEADERS = { "Cache-Control": "no-store, max-age=0" };
const UPSERT_BATCH_SIZE = 250;

function chunks<T>(items: T[], size: number) {
  return Array.from(
    { length: Math.ceil(items.length / size) },
    (_, index) => items.slice(index * size, (index + 1) * size),
  );
}

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  const startedAtIso = new Date().toISOString();
  const currentYear = new Date().getUTCFullYear();
  const year = validateFredTipsHistoricalYear(
    request.nextUrl.searchParams.get("year") ?? currentYear,
    currentYear,
  );
  if (!year) {
    return NextResponse.json(
      { error: `year must be between 2003 and ${currentYear}` },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const apiKey = process.env.FRED_API_KEY;
  const supabase = getSupabaseAdminClient();
  if (!apiKey || !supabase) {
    return NextResponse.json(
      { error: "FRED or Supabase is not configured" },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }

  try {
    const response = await fetch(buildFredTipsHistoricalUrl(year, apiKey), {
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw new Error(`FRED returned ${response.status}`);

    const observations = buildFredTipsHistoricalObservations(
      await response.json(),
      year,
    );
    if (observations.length === 0) {
      throw new Error(`FRED DFII10 has no observations for ${year}`);
    }

    const rows = observations.map((observation) => ({
      source_key: observation.sourceKey,
      driver_key: observation.driverKey,
      series_key: observation.seriesKey,
      numeric_value: observation.numericValue,
      unit: observation.unit,
      observed_at: observation.observedAt,
      released_at: observation.releasedAt ?? null,
      source_url: observation.sourceUrl,
      quality: observation.quality,
      metadata: observation.metadata ?? {},
    }));
    const batches = chunks(rows, UPSERT_BATCH_SIZE);
    for (const batch of batches) {
      const { error } = await supabase.from("evidence_observations").upsert(
        batch,
        {
          onConflict: "source_key,series_key,observed_at",
          ignoreDuplicates: false,
        },
      );
      if (error) throw new Error(error.message);
    }

    const durationMs = Date.now() - startedAt;
    await recordRunLog({
      runType: "tips_yield_backfill",
      status: "success",
      startedAt: startedAtIso,
      durationMs,
      metadata: {
        year,
        observations: observations.length,
        batches: batches.length,
        sourceUrl: FRED_DFII10_SOURCE_URL,
        replayAvailability:
          "Historical observations do not include a publication timestamp.",
      },
      error: null,
    });

    return NextResponse.json(
      {
        ok: true,
        status: "success",
        year,
        durationMs,
        observations: observations.length,
        firstObservedAt: observations[0]?.observedAt ?? null,
        lastObservedAt: observations.at(-1)?.observedAt ?? null,
        replayAvailability:
          "Stored for historical driver research. Replay remains conservative because FRED history does not supply exact publication timestamps.",
      },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const message = error instanceof Error ? error.message : String(error);
    await recordRunLog({
      runType: "tips_yield_backfill",
      status: "error",
      startedAt: startedAtIso,
      durationMs,
      metadata: { year, sourceUrl: FRED_DFII10_SOURCE_URL },
      error: message,
    });
    return NextResponse.json(
      { ok: false, status: "error", year, durationMs, error: message },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
