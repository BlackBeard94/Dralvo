import { NextResponse } from "next/server";

import type { CandleOHLC } from "@/data/indicators";
import { rateLimitedTwelveDataFetch } from "@/data/ingestion/twelve-data-limiter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* -------------------------------------------------------------------------- */
/*  Twelve Data (fallback source)                                             */
/* -------------------------------------------------------------------------- */
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

async function fetchTwelveData(apiKey: string): Promise<Quote> {
  const response = await rateLimitedTwelveDataFetch(
    `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent("XAU/USD")}&interval=4h&outputsize=30&apikey=${apiKey}`,
  );
  if (!response.ok) throw new Error(`Twelve Data returned ${response.status}`);
  const candles = parseXauusdCandles((await response.json()) as TwelveDataResponse);
  return { candles, spot: candles.at(-1)!.close };
}

/* -------------------------------------------------------------------------- */
/*  Yahoo Finance (primary source)                                            */
/*  Free, no daily credit cap. GC=F = COMEX gold, tracks spot XAUUSD closely. */
/* -------------------------------------------------------------------------- */
type YahooChart = {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      meta?: { regularMarketPrice?: number };
      indicators?: {
        quote?: Array<{
          open?: (number | null)[];
          high?: (number | null)[];
          low?: (number | null)[];
          close?: (number | null)[];
        }>;
      };
    }>;
    error?: unknown;
  };
};

function parseYahooCandles(data: YahooChart): Quote {
  const r = data.chart?.result?.[0];
  const q = r?.indicators?.quote?.[0];
  const n = r?.timestamp?.length ?? 0;
  if (!r || !q || n === 0) throw new Error("Yahoo returned no gold chart data");

  const candles: CandleOHLC[] = [];
  for (let i = 0; i < n; i++) {
    const o = q.open?.[i];
    const h = q.high?.[i];
    const l = q.low?.[i];
    const c = q.close?.[i];
    if (
      typeof o === "number" && Number.isFinite(o) && o > 0 &&
      typeof h === "number" && Number.isFinite(h) &&
      typeof l === "number" && Number.isFinite(l) &&
      typeof c === "number" && Number.isFinite(c) &&
      h >= l
    ) {
      candles.push({ open: o, high: h, low: l, close: c });
    }
  }
  if (candles.length < 2) throw new Error("Yahoo did not return enough valid gold candles");
  const spot = r.meta?.regularMarketPrice ?? candles.at(-1)!.close;
  return { candles, spot };
}

async function fetchYahoo(): Promise<Quote> {
  const res = await fetch(
    "https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1h&range=5d",
    { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(12_000) },
  );
  if (!res.ok) throw new Error(`Yahoo returned ${res.status}`);
  return parseYahooCandles((await res.json()) as YahooChart);
}

/* -------------------------------------------------------------------------- */
/*  Route — Yahoo primary, Twelve Data fallback, module-memory cache          */
/* -------------------------------------------------------------------------- */
type Quote = { spot: number; candles: CandleOHLC[] };

/**
 * Last good quote, cached in module memory (per warm serverless instance):
 *   1. Within FRESH_MS, answer straight from cache so many polling dashboards
 *      share one upstream call.
 *   2. If every source fails, serve the last good quote marked `stale` instead
 *      of blanking the card. Raw provider errors are logged, never sent to UI.
 */
let cache: { spot: number; candles: CandleOHLC[]; at: number } | null = null;
const FRESH_MS = 45_000; // dashboards poll every 60s; serve cache below this age

export async function GET() {
  if (cache && Date.now() - cache.at < FRESH_MS) {
    return NextResponse.json({ ok: true, source: "cache", spot: cache.spot, candles: cache.candles });
  }

  const sources: Array<[string, () => Promise<Quote>]> = [["yahoo", fetchYahoo]];
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (apiKey) sources.push(["twelve-data", () => fetchTwelveData(apiKey)]);

  for (const [source, fn] of sources) {
    try {
      const { candles, spot } = await fn();
      cache = { spot, candles, at: Date.now() };
      return NextResponse.json({ ok: true, source, spot, candles });
    } catch (error) {
      console.warn(`[/api/xauusd] ${source} failed:`, error instanceof Error ? error.message : String(error));
    }
  }

  // Every source failed — prefer last good data over an error.
  if (cache) {
    return NextResponse.json({ ok: true, source: "cache", stale: true, spot: cache.spot, candles: cache.candles });
  }
  return NextResponse.json(
    { ok: false, source: "unavailable", error: "market_data_unavailable", candles: [] },
    { status: 200 },
  );
}
