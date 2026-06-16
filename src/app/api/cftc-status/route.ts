/**
 * GET /api/cftc-status
 * Public endpoint consumed by Dralvo_GoldEA.
 * Returns the latest persisted CFTC bullish status for XAUUSD.
 *
 * Response: { ok, bullish, mm_net, updated, fetched_at, source }
 */
import { NextRequest, NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CFTCStatus = {
  bullish: boolean;
  mm_net: number;
  updated: string;
  fetched_at?: string;
};

type CFTCStatusRow = {
  bullish: boolean;
  mm_net: number;
  updated: string;
  fetched_at: string | null;
};

const DEFAULT_STATUS: CFTCStatus = {
  bullish: false,
  mm_net: 0,
  updated: "1970-01-01",
};

let memoryFallback: CFTCStatus = {
  bullish: process.env.CFTC_BULLISH === "true",
  mm_net: Number.parseInt(process.env.CFTC_MM_NET ?? "0", 10) || 0,
  updated: process.env.CFTC_UPDATED ?? DEFAULT_STATUS.updated,
};

function isAuthorized(request: NextRequest) {
  const secret = process.env.DRALVO_API_SECRET;
  if (!secret) return true;

  const authorization = request.headers.get("authorization") ?? "";
  return authorization === `Bearer ${secret}`;
}

function normalizeStatus(input: unknown): CFTCStatus | null {
  if (!input || typeof input !== "object") return null;

  const body = input as Record<string, unknown>;
  const bullish = body.bullish;
  const mmNet = body.mm_net;
  const updated = body.updated;

  if (typeof bullish !== "boolean") return null;
  if (typeof mmNet !== "number" || !Number.isFinite(mmNet)) return null;
  if (typeof updated !== "string" || updated.trim().length === 0) return null;

  return {
    bullish,
    mm_net: Math.round(mmNet),
    updated: updated.trim(),
  };
}

async function readStatusFromSupabase(): Promise<CFTCStatus | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("cftc_status")
    .select("bullish,mm_net,updated,fetched_at")
    .eq("id", "xauusd")
    .maybeSingle();

  if (error) {
    console.error("[cftc-status] Supabase read error", JSON.stringify(error));
    return null;
  }

  if (!data) return null;

  const row = data as CFTCStatusRow;
  return {
    bullish: row.bullish,
    mm_net: row.mm_net,
    updated: row.updated,
    fetched_at: row.fetched_at ?? undefined,
  };
}

async function writeStatusToSupabase(status: CFTCStatus) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { ok: false, reason: "supabase-not-configured" } as const;

  const { error } = await supabase.from("cftc_status").upsert(
    {
      id: "xauusd",
      bullish: status.bullish,
      mm_net: status.mm_net,
      updated: status.updated,
      fetched_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    console.error("[cftc-status] Supabase write error", JSON.stringify(error));
    return { ok: false, reason: "supabase-write-error" } as const;
  }

  return { ok: true } as const;
}

export async function GET() {
  const persisted = await readStatusFromSupabase();
  const status = persisted ?? memoryFallback ?? DEFAULT_STATUS;

  return NextResponse.json(
    {
      ok: Boolean(persisted),
      bullish: status.bullish,
      mm_net: status.mm_net,
      updated: status.updated,
      fetched_at: status.fetched_at,
      source: persisted ? "supabase" : "fallback",
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const status = normalizeStatus(body);
  if (!status) {
    return NextResponse.json(
      { ok: false, error: "Expected { bullish: boolean, mm_net: number, updated: string }" },
      { status: 400 },
    );
  }

  memoryFallback = { ...status, fetched_at: new Date().toISOString() };
  const write = await writeStatusToSupabase(memoryFallback);

  return NextResponse.json({
    ok: write.ok,
    stored: write.ok ? "supabase" : "memory-fallback",
    reason: write.ok ? undefined : write.reason,
    ...memoryFallback,
  });
}
