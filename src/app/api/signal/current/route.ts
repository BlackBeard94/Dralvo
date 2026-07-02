/**
 * GET /api/signal/current
 *
 * Public endpoint returning the current Dralvo Tier 3A signal for XAUUSD:
 * signal state (long/neutral), per-driver check (CFTC, trend, pullback),
 * entry/SL/TP when long, plus the current CFTC positioning.
 *
 * Consumed by the MT5 indicator/EA (WebRequest), the Telegram bot, the web
 * dashboard, and the marketing site. Cached briefly to protect the Twelve Data
 * quota; rate limited to prevent abuse.
 */
import { NextResponse, type NextRequest } from "next/server";

import type { CandleOHLC } from "@/data/indicators";
import { rateLimitedTwelveDataFetch } from "@/data/ingestion/twelve-data-limiter";
import { checkRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";
import { evaluateTier3A, TIER3A, type SignalResult } from "@/lib/signal";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes - signal changes at most daily
const DAILY_OUTPUT_SIZE = 250; // enough history for EMA200
const STRATEGY = "Tier 3A - CFTC + Trend + Pullback (D1)";

type CftcStatus = { mm_net: number; updated: string };

type SignalPayload = {
  ok: boolean;
  asset: "XAUUSD";
  strategy: string;
  signal: SignalResult["signal"];
  regime: SignalResult["regime"];
  drivers: SignalResult["drivers"];
  price: SignalResult["price"] & { asOf: string };
  entry: SignalResult["entry"];
  cftc: CftcStatus;
  generatedAt: string;
};

let cache: { at: number; payload: SignalPayload } | null = null;

async function readCftc(): Promise<CftcStatus | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("cftc_status")
    .select("mm_net,updated")
    .eq("id", "xauusd")
    .maybeSingle();

  if (error || !data) return null;
  return { mm_net: Number(data.mm_net) || 0, updated: String(data.updated) };
}

type TwelveDailyResponse = {
  values?: Array<{
    datetime: string;
    open: string;
    high: string;
    low: string;
    close: string;
  }>;
  status?: string;
  message?: string;
};

/** Parse Twelve Data daily series into oldest-first OHLC candles. */
export function parseDailyCandles(data: TwelveDailyResponse): {
  candles: CandleOHLC[];
  asOf: string;
} {
  if (data.status === "error") {
    throw new Error(data.message ?? "Twelve Data error");
  }
  const rows = data.values ?? [];
  const candles: CandleOHLC[] = rows
    .map((r) => ({
      open: Number(r.open),
      high: Number(r.high),
      low: Number(r.low),
      close: Number(r.close),
    }))
    .filter(
      (c) =>
        Number.isFinite(c.open) &&
        Number.isFinite(c.high) &&
        Number.isFinite(c.low) &&
        Number.isFinite(c.close) &&
        c.open > 0 &&
        c.high >= c.low,
    )
    .reverse(); // Twelve Data returns newest-first; we want oldest-first

  if (candles.length < TIER3A.emaSlow) {
    throw new Error(
      `Need at least ${TIER3A.emaSlow} daily candles, got ${candles.length}`,
    );
  }
  // newest row is rows[0]; its datetime is the latest bar timestamp
  const asOf = rows[0]?.datetime ?? "";
  return { candles, asOf };
}

async function fetchDailyCandles(apiKey: string) {
  const url =
    `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent("XAU/USD")}` +
    `&interval=1day&outputsize=${DAILY_OUTPUT_SIZE}&apikey=${apiKey}`;
  const response = await rateLimitedTwelveDataFetch(url);
  if (!response.ok) {
    throw new Error(`Twelve Data returned ${response.status}`);
  }
  return parseDailyCandles((await response.json()) as TwelveDailyResponse);
}

function jsonResponse(payload: SignalPayload, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "public, max-age=60, s-maxage=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function GET(request: NextRequest) {
  const rate = checkRateLimit({
    key: rateLimitKey(request, "signal:current"),
    limit: 60,
    windowMs: 60_000,
  });
  if (!rate.allowed) return rateLimitResponse(rate.resetAt);

  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return jsonResponse(cache.payload);
  }

  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "TWELVE_DATA_API_KEY not set" },
      { status: 503 },
    );
  }

  const cftc = await readCftc();
  if (!cftc) {
    return NextResponse.json(
      { ok: false, error: "CFTC status unavailable" },
      { status: 503 },
    );
  }

  let candles: CandleOHLC[];
  let asOf: string;
  try {
    ({ candles, asOf } = await fetchDailyCandles(apiKey));
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }

  const result = evaluateTier3A({ cftcNet: cftc.mm_net, candles });

  const payload: SignalPayload = {
    ok: true,
    asset: "XAUUSD",
    strategy: STRATEGY,
    signal: result.signal,
    regime: result.regime,
    drivers: result.drivers,
    price: { ...result.price, asOf },
    entry: result.entry,
    cftc,
    generatedAt: new Date().toISOString(),
  };

  cache = { at: Date.now(), payload };
  return jsonResponse(payload);
}
