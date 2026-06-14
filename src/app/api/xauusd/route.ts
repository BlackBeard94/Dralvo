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

export async function GET() {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        source: "unavailable",
        error: "TWELVE_DATA_API_KEY not set",
        candles: [],
      },
      { status: 503 },
    );
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

    return NextResponse.json({
      ok: true,
      source: "twelve-data",
      spot: candles.at(-1)!.close,
      candles,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "unavailable",
        error: error instanceof Error ? error.message : String(error),
        candles: [],
      },
      { status: 502 },
    );
  }
}
