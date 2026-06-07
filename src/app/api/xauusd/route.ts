import { NextResponse } from "next/server";
import type { CandleOHLC } from "@/data/indicators";
import { dashboardCandles as fallbackCandles, XAUUSD_SPOT } from "@/data/indicators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface TwelveDataCandle {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
}

export async function GET() {
  const apiKey = process.env.TWELVE_DATA_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      ok: true,
      source: "fallback",
      spot: XAUUSD_SPOT,
      candles: fallbackCandles,
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(
      `https://api.twelvedata.com/time_series?symbol=XAU/USD&interval=4h&outputsize=30&apikey=${apiKey}`,
      { signal: controller.signal },
    );

    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Twelve Data returned ${res.status}`);
    }

    const json = await res.json();

    if (json.status === "error") {
      throw new Error(json.message ?? "Twelve Data error");
    }

    const rawCandles: TwelveDataCandle[] = json.values ?? [];
    const candles: CandleOHLC[] = rawCandles
      .map((c) => ({
        open: parseFloat(c.open),
        high: parseFloat(c.high),
        low: parseFloat(c.low),
        close: parseFloat(c.close),
      }))
      .filter((c) => !isNaN(c.open))
      .reverse(); // Twelve Data returns newest first

    const spot = candles.length > 0 ? candles[candles.length - 1].close : XAUUSD_SPOT;

    return NextResponse.json({
      ok: true,
      source: "twelve-data",
      spot,
      candles,
    });
  } catch {
    return NextResponse.json({
      ok: true,
      source: "fallback",
      spot: XAUUSD_SPOT,
      candles: fallbackCandles,
    });
  }
}
