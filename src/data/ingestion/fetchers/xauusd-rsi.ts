import type { IndicatorSnapshot } from "@/data/indicators";
import type { IngestionResult } from "@/data/ingestion/types";
import { formatObservedLabel } from "@/data/ingestion/types";
import { rateLimitedTwelveDataFetch } from "@/data/ingestion/twelve-data-limiter";

/**
 * XAUUSD RSI (14) fetcher.
 *
 * Fetches the Relative Strength Index (14-period) for XAU/USD from Twelve Data.
 * RSI is a momentum oscillator that measures the speed and magnitude of price
 * changes. Values above 70 indicate overbought, below 30 indicate oversold.
 *
 * Replaces the mock COT Swap Dealer indicator.
 */

const TWELVE_DATA_BASE = "https://api.twelvedata.com/rsi";

interface TwelveDataRsiResponse {
  meta?: { symbol: string; indicator: string };
  values?: Array<{ datetime: string; rsi: string }>;
  status?: string;
  message?: string;
}

function determineStatus(rsi: number): IndicatorSnapshot["status"] {
  if (rsi > 60) return "bullish";
  if (rsi < 40) return "bearish";
  return "neutral";
}

function buildSummary(rsi: number): string {
  if (rsi > 70) {
    return `RSI at ${rsi.toFixed(1)} - overbought territory. Gold may be due for a pullback or consolidation.`;
  }
  if (rsi > 60) {
    return `RSI at ${rsi.toFixed(1)} - bullish momentum is building but not yet overextended.`;
  }
  if (rsi < 30) {
    return `RSI at ${rsi.toFixed(1)} - oversold territory. Potential bounce or reversal setup forming.`;
  }
  if (rsi < 40) {
    return `RSI at ${rsi.toFixed(1)} - bearish momentum is dominant. Watch for support levels.`;
  }
  return `RSI at ${rsi.toFixed(1)} - neutral zone. Gold is trading without strong directional momentum.`;
}

export async function fetchXauusdRsi(): Promise<IngestionResult> {
  const now = new Date();
  const observedAt = now.toISOString();
  const observedLabel = formatObservedLabel(now);

  const apiKey = process.env.TWELVE_DATA_API_KEY;

  if (!apiKey) {
    return {
      key: "xauusd-rsi",
      status: "error",
      error: "TWELVE_DATA_API_KEY not set",
    };
  }

  try {
    const url = `${TWELVE_DATA_BASE}?symbol=XAU/USD&interval=1h&time_period=14&outputsize=30&apikey=${apiKey}`;
    const response = await rateLimitedTwelveDataFetch(url);

    if (!response.ok) {
      throw new Error(`Twelve Data returned ${response.status}`);
    }

    const data = (await response.json()) as TwelveDataRsiResponse;

    if (data.status === "error") {
      throw new Error(data.message ?? "Twelve Data error");
    }

    if (!data.values || data.values.length === 0) {
      throw new Error("No RSI values returned");
    }

    const rsi = parseFloat(data.values[0].rsi);
    if (isNaN(rsi)) {
      throw new Error(`Invalid RSI value: ${data.values[0].rsi}`);
    }

    // Extract sparkline: reverse to chronological (oldest first), parse RSI values
    const sparkline = data.values
      .map((v) => parseFloat(v.rsi))
      .filter((v) => !isNaN(v))
      .reverse();

    // Change is relative to the 50 midpoint
    const changeFromNeutral = rsi - 50;

    const snapshot: IndicatorSnapshot = {
      key: "xauusd-rsi",
      name: "RSI (14)",
      source: "Twelve Data",
      cadence: "1h",
      value: rsi.toFixed(1),
      change: `${changeFromNeutral >= 0 ? "+" : ""}${changeFromNeutral.toFixed(1)} from 50`,
      status: determineStatus(rsi),
      summary: buildSummary(rsi),
      observedAt,
      observedLabel,
      dataQuality: "delayed",
      qualityNote: "Fetched from Twelve Data RSI endpoint on the configured 1h interval.",
      sparkline: sparkline.length >= 2 ? sparkline : undefined,
    };

    return { key: snapshot.key, status: "success", data: snapshot };
  } catch (err) {
    return {
      key: "xauusd-rsi",
      status: "error",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

