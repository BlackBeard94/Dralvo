import { NextRequest, NextResponse } from "next/server";

import {
  buildXauusdHistoricalObservations,
  buildXauusdHistoricalUrl,
  validateXauusdHistoricalYear,
} from "@/data/ingestion/fetchers/xauusd-spot";
import { rateLimitedTwelveDataFetch } from "@/data/ingestion/twelve-data-limiter";
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
  const year = validateXauusdHistoricalYear(
    request.nextUrl.searchParams.get("year") ?? currentYear,
    currentYear,
  );
  if (!year) {
    return NextResponse.json(
      { error: `year must be between 2000 and ${currentYear}` },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const apiKey = process.env.TWELVE_DATA_API_KEY;
  const supabase = getSupabaseAdminClient();
  if (!apiKey || !supabase) {
    return NextResponse.json(
      { error: "Twelve Data or Supabase is not configured" },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }

  try {
    const response = await rateLimitedTwelveDataFetch(
      buildXauusdHistoricalUrl(year, apiKey),
      { cache: "no-store" },
      20_000,
    );
    if (!response.ok) {
      throw new Error(`Twelve Data returned ${response.status}`);
    }

    const observations = buildXauusdHistoricalObservations(
      await response.json(),
      year,
    );
    if (observations.length === 0) {
      throw new Error(`Twelve Data has no XAU/USD observations for ${year}`);
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
      runType: "xauusd_price_backfill",
      status: "success",
      startedAt: startedAtIso,
      durationMs,
      metadata: {
        year,
        providerRequests: 1,
        observations: observations.length,
        batches: batches.length,
        sourceUrl: "https://twelvedata.com/docs",
      },
      error: null,
    });

    return NextResponse.json(
      {
        ok: true,
        status: "success",
        year,
        durationMs,
        providerRequests: 1,
        observations: observations.length,
        firstObservedAt: observations[0]?.observedAt ?? null,
        lastObservedAt: observations.at(-1)?.observedAt ?? null,
        replayAvailability:
          "Stored for historical price research. Replay remains conservative because historical bars do not include an exact provider publication timestamp.",
      },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const message = error instanceof Error ? error.message : String(error);
    await recordRunLog({
      runType: "xauusd_price_backfill",
      status: "error",
      startedAt: startedAtIso,
      durationMs,
      metadata: {
        year,
        providerRequests: 1,
        sourceUrl: "https://twelvedata.com/docs",
      },
      error: message,
    });
    return NextResponse.json(
      { ok: false, status: "error", year, durationMs, error: message },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
