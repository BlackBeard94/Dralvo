import { NextResponse } from "next/server";
import { fetchAllIndicators } from "@/data/ingestion";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const authHeader = request.headers.get("authorization");
  const requestUrl = new URL(request.url);
  return (
    authHeader === `Bearer ${cronSecret}` ||
    requestUrl.searchParams.get("secret") === cronSecret
  );
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();

  // 1. Fetch all 6 indicators in parallel
  const results = await fetchAllIndicators();

  // 2. Write to Supabase using service role (bypasses RLS)
  const supabase = getSupabaseAdminClient();
  const writeResults: { key: string; written: boolean; error?: string }[] = [];

  if (supabase) {
    for (const result of results) {
      if (result.status === "success") {
        const { key, data } = result;
        const { error } = await supabase.from("indicator_snapshots").insert({
          indicator_key: key,
          value_json: data,
          observed_at: data.observedAt,
        });

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
    // No Supabase client — still return fetch results for debugging
    for (const result of results) {
      writeResults.push({
        key: result.key,
        written: false,
        error: "SUPABASE_SERVICE_ROLE_KEY not configured",
      });
    }
  }

  const durationMs = Date.now() - startedAt;

  return NextResponse.json({
    ok: true,
    durationMs,
    ingestedAt: new Date().toISOString(),
    indicators: writeResults,
  });
}
