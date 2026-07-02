import { NextResponse } from "next/server";

import type { CandleOHLC } from "@/data/indicators";
import { rateLimitedTwelveDataFetch } from "@/data/ingestion/twelve-data-limiter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TwelveDataCandle = {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
};

type TwelveDataResponse = {
  values?: TwelveDataCandle[];
  status?: string;
  message?: string;
};

export function parseXauusdCandles(data: TwelveDataResponse) {
  if (data.status === "error") {
    throw new Error(data.message ?? "Twelve Data error");
  }

  const candles: CandleOHLC[] = (data.values ?? [])
    .map((candle) => ({
      open: Number(candle.open),
      high: Number(candle.high),
      low: Number(candle.low),
      close: Number(candle.close),
    }))
    .filter(
      (candle) =>
        Number.isFinite(candle.open) &&
        Number.isFinite(candle.high) &&
        Number.isFinite(candle.low) &&
        Number.isFinite(candle.close) &&
        candle.open > 0 &&
        candle.high >= candle.low,
    )
    .reverse();

  if (candles.length < 2) {
    throw new Error("Twelve Data did not return enough valid XAU/USD candles");
  }

  return candles;
}

/**
 * Last good response, cached in module memory (per warm serverless instance).
 * Serves two jobs:
 *   1. Within FRESH_MS, answer straight from cache so many polling dashboards
 *      share one upstream call — this is what keeps Twelve Data under its
 *      free-tier burst limit and prevents 429s in the first place.
 *   2. On any upstream failure (429, timeout, bad payload) we return the last
 *      good data marked `stale` instead of blanking the card with a raw
 *      provider error. Real error is logged server-side, never sent to the UI.
 */
let cache: { spot: number; candles: CandleOHLC[]; at: number } | null = null;
const FRESH_MS = 45_000; // dashboards poll every 60s; serve cache below this age

export async function GET() {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    if (cache) {
      return NextResponse.json({ ok: true, source: "cache", stale: true, spot: cache.spot, candles: cache.candles });
    }
    return NextResponse.json(
      { ok: false, source: "unavailable", error: "market_data_unavailable", candles: [] },
      { status: 503 },
    );
  }

  // Fresh enough — skip the upstream call entirely.
  if (cache && Date.now() - cache.at < FRESH_MS) {
    return NextResponse.json({ ok: true, source: "cache", spot: cache.spot, candles: cache.candles });
  }

  try {
    const response = await rateLimitedTwelveDataFetch(
      `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent("XAU/USD")}&interval=4h&outputsize=30&apikey=${apiKey}`,
    );
    if (!response.ok) {
      throw new Error(`Twelve Data returned ${response.status}`);
    }

    const candles = parseXauusdCandles(
      (await response.json()) as TwelveDataResponse,
    );
    const spot = candles.at(-1)!.close;
    cache = { spot, candles, at: Date.now() };

    return NextResponse.json({ ok: true, source: "twelve-data", spot, candles });
  } catch (error) {
    // Log the real cause for ops; never surface provider internals to users.
    console.warn("[/api/xauusd] upstream failed:", error instanceof Error ? error.message : String(error));

    // Prefer last good data over an error — the card stays populated.
    if (cache) {
      return NextResponse.json({ ok: true, source: "twelve-data", stale: true, spot: cache.spot, candles: cache.candles });
    }

    return NextResponse.json(
      { ok: false, source: "unavailable", error: "market_data_unavailable", candles: [] },
      { status: 200 },
    );
  }
}
