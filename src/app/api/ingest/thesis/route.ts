import { NextResponse } from "next/server";

import { IMPLEMENTED_DRIVER_SOURCE_REGISTRY } from "@/data/driver-registry";
import {
  buildGoldThesis,
  type EvidenceRow,
} from "@/lib/intelligence/gold-thesis";
import { isCronAuthorized } from "@/lib/api-auth";
import { recordRunLog } from "@/lib/run-logs";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const NO_STORE_HEADERS = { "Cache-Control": "no-store, max-age=0" };

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  const startedAtIso = new Date().toISOString();
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY not configured" },
      { status: 503 },
    );
  }

  try {
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
    if (error) throw new Error(error.message);

    const thesis = buildGoldThesis((data ?? []) as EvidenceRow[]);
    const thesisDate = thesis.generatedAt.slice(0, 10);
    const { error: writeError } = await supabase.from("thesis_snapshots").upsert(
      {
        thesis_date: thesisDate,
        state: thesis.state,
        thesis_json: thesis,
        methodology_version: thesis.methodologyVersion,
        generated_at: thesis.generatedAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "thesis_date", ignoreDuplicates: false },
    );
    if (writeError) throw new Error(writeError.message);

    await recordRunLog({
      runType: "gold_thesis_generate",
      status: "success",
      startedAt: startedAtIso,
      durationMs: Date.now() - startedAt,
      metadata: {
        thesisDate,
        state: thesis.state,
        coverage: thesis.coverage,
        methodologyVersion: thesis.methodologyVersion,
        priceRelationship: thesis.priceRelationship?.state ?? null,
      },
      error: null,
    });

    return NextResponse.json(
      { ok: true, thesis },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await recordRunLog({
      runType: "gold_thesis_generate",
      status: "error",
      startedAt: startedAtIso,
      durationMs: Date.now() - startedAt,
      metadata: {},
      error: message,
    });
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
