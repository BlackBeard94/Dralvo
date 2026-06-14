import { NextResponse } from "next/server";

import {
  fetchAllIndicators,
  fetchIndicators,
  getDueIndicatorKeys,
  getMissingEvidenceIndicatorKeys,
  INDICATOR_KEYS,
  mergeDueAndEvidenceBackfillKeys,
} from "@/data/ingestion";
import { isCronAuthorized } from "@/lib/api-auth";
import { recordRunLog } from "@/lib/run-logs";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const NO_STORE_HEADERS = { "Cache-Control": "no-store, max-age=0" };

type LatestSnapshotRow = {
  indicator_key: string;
  observed_at: string;
};

function latestObservedMap(rows: LatestSnapshotRow[] | null | undefined) {
  const map: Record<string, string> = {};

  for (const row of rows ?? []) {
    const current = map[row.indicator_key];
    if (!current || Date.parse(row.observed_at) > Date.parse(current)) {
      map[row.indicator_key] = row.observed_at;
    }
  }

  return map;
}

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  const startedAtIso = new Date().toISOString();

  const supabase = getSupabaseAdminClient();
  const writeResults: { key: string; written: boolean; error?: string }[] = [];
  let dueKeys = INDICATOR_KEYS;
  let skippedKeys: string[] = [];
  let evidenceBackfillKeys: string[] = [];

  if (supabase) {
    const [
      { data: latestRows, error: latestError },
      { data: evidenceRows, error: evidenceCoverageError },
    ] = await Promise.all([
      supabase
        .from("indicator_snapshots")
        .select("indicator_key, observed_at")
        .in("indicator_key", INDICATOR_KEYS)
        .order("observed_at", { ascending: false })
        .limit(120),
      supabase
        .from("evidence_observations")
        .select("driver_key, series_key")
        .limit(500),
    ]);

    if (!latestError) {
      dueKeys = getDueIndicatorKeys(latestObservedMap(latestRows), new Date(startedAtIso));
    }
    if (!evidenceCoverageError) {
      evidenceBackfillKeys = getMissingEvidenceIndicatorKeys(evidenceRows ?? []);
      dueKeys = mergeDueAndEvidenceBackfillKeys(dueKeys, evidenceBackfillKeys);
    }
    skippedKeys = INDICATOR_KEYS.filter((key) => !dueKeys.includes(key));

    const results = await fetchIndicators(dueKeys);

    for (const result of results) {
      if (result.status === "success") {
        const { key, data } = result;
        const { error: snapshotError } = await supabase.from("indicator_snapshots").upsert(
          {
            indicator_key: key,
            value_json: data,
            observed_at: data.observedAt,
          },
          {
            onConflict: "indicator_key,observed_at",
            ignoreDuplicates: false,
          },
        );

        let evidenceError: { message: string } | null = null;
        if (!snapshotError && result.observations?.length) {
          const { error } = await supabase.from("evidence_observations").upsert(
            result.observations.map((observation) => ({
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
            })),
            {
              onConflict: "source_key,series_key,observed_at",
              ignoreDuplicates: false,
            },
          );
          evidenceError = error;
        }

        const error = snapshotError ?? evidenceError;
        writeResults.push({
          key,
          written: !error,
          error: error?.message,
        });
      } else {
        writeResults.push({
          key: result.key,
          written: false,
          error: result.error,
        });
      }
    }
  } else {
    const results = await fetchAllIndicators();

    for (const result of results) {
      writeResults.push({
        key: result.key,
        written: false,
        error: "SUPABASE_SERVICE_ROLE_KEY not configured",
      });
    }
  }

  const failed = writeResults.filter((result) => !result.written);
  const written = writeResults.length - failed.length;
  const allSucceeded = failed.length === 0;
  const allFailed = written === 0;

  const response = {
    ok: allSucceeded,
    partial: !allSucceeded && !allFailed,
    status: allSucceeded ? "success" : allFailed ? "error" : "partial",
    durationMs: Date.now() - startedAt,
    ingestedAt: new Date().toISOString(),
    counts: {
      total: writeResults.length,
      written,
      failed: failed.length,
      skipped: skippedKeys.length,
    },
    indicators: writeResults,
    skipped: skippedKeys,
  };

  await recordRunLog({
    runType: "indicator_ingest",
    status: failed.length > 0 ? "error" : "success",
    startedAt: startedAtIso,
    durationMs: response.durationMs,
    metadata: {
      total: writeResults.length,
      written,
      failed: failed.length,
      skipped: skippedKeys.length,
      due: dueKeys,
      evidenceBackfill: evidenceBackfillKeys,
      partial: response.partial,
      indicators: writeResults,
    },
    error: failed.length > 0
      ? failed.map((result) => `${result.key}: ${result.error}`).join("; ")
      : null,
  });

  return NextResponse.json(response, { headers: NO_STORE_HEADERS });
}
