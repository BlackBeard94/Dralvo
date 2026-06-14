import { NextRequest, NextResponse } from "next/server";

import {
  cftcHistoricalArchiveUrl,
  parseCftcHistoricalArchive,
  validateCftcHistoricalYear,
} from "@/data/ingestion/fetchers/cftc-gold-positioning";
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
  const year = validateCftcHistoricalYear(
    request.nextUrl.searchParams.get("year") ?? currentYear - 1,
    currentYear,
  );
  if (!year) {
    return NextResponse.json(
      { error: `year must be between 2009 and ${currentYear}` },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const sourceUrl = cftcHistoricalArchiveUrl(year);
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY not configured" },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }

  try {
    const response = await fetch(sourceUrl, {
      signal: AbortSignal.timeout(30_000),
      headers: {
        accept: "application/zip,*/*;q=0.8",
        "user-agent": "Dralvo/1.0 (gold research data ingestion)",
      },
    });
    if (!response.ok) throw new Error(`CFTC returned ${response.status}`);

    const { reports, observations } = parseCftcHistoricalArchive(
      await response.arrayBuffer(),
      year,
    );
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

    for (const batch of chunks(rows, UPSERT_BATCH_SIZE)) {
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
      runType: "cftc_gold_backfill",
      status: "success",
      startedAt: startedAtIso,
      durationMs,
      metadata: {
        year,
        reports: reports.length,
        observations: observations.length,
        batches: chunks(rows, UPSERT_BATCH_SIZE).length,
        sourceUrl,
        replayAvailability:
          "Historical archive has report dates but no exact release timestamps.",
      },
      error: null,
    });

    return NextResponse.json(
      {
        ok: true,
        status: "success",
        year,
        durationMs,
        reports: reports.length,
        observations: observations.length,
        firstObservedAt: observations[0]?.observedAt ?? null,
        lastObservedAt: observations.at(-1)?.observedAt ?? null,
        replayAvailability:
          "Stored for historical driver research. Replay remains conservative because the archive does not include exact release timestamps.",
      },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const message = error instanceof Error ? error.message : String(error);
    await recordRunLog({
      runType: "cftc_gold_backfill",
      status: "error",
      startedAt: startedAtIso,
      durationMs,
      metadata: { year, sourceUrl },
      error: message,
    });
    return NextResponse.json(
      { ok: false, status: "error", year, durationMs, error: message },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
