import type { IndicatorSnapshot } from "@/data/indicators";
import type { IngestionResult } from "@/data/ingestion/types";
import { formatObservedLabel } from "@/data/ingestion/types";
import { rateLimitedTwelveDataFetch } from "@/data/ingestion/twelve-data-limiter";

/**
 * XAUUSD MACD fetcher.
 *
 * Fetches the Moving Average Convergence Divergence for XAU/USD from Twelve Data.
 * MACD is a trend-following momentum indicator that shows the relationship
 * between two moving averages (12 and 26 period EMAs).
 *
 * Replaces the mock COMEX Inventory indicator.
 */

const TWELVE_DATA_BASE = "https://api.twelvedata.com/macd";

interface TwelveDataMacdResponse {
  meta?: { symbol: string; indicator: string };
  values?: Array<{
    datetime: string;
    macd: string;
    macd_signal: string;
    macd_hist: string;
  }>;
  status?: string;
  message?: string;
}

function determineStatus(macd: number, signal: number): IndicatorSnapshot["status"] {
  if (macd > signal) return "bullish";
  if (macd < signal) return "bearish";
  return "neutral";
}

function buildSummary(macd: number, signal: number, hist: number): string {
  const crossover = macd > signal ? "above" : "below";
  const histDirection = hist >= 0 ? "rising" : "falling";

  if (macd > 0 && macd > signal) {
    return `MACD (${macd.toFixed(2)}) ${crossover} signal (${signal.toFixed(2)}) - bullish trend with ${histDirection} histogram. Uptrend confirmed.`;
  }
  if (macd < 0 && macd < signal) {
    return `MACD (${macd.toFixed(2)}) ${crossover} signal (${signal.toFixed(2)}) - bearish trend with ${histDirection} histogram. Downtrend in play.`;
  }
  if (macd > signal) {
    return `MACD (${macd.toFixed(2)}) ${crossover} signal (${signal.toFixed(2)}) - potential bullish crossover forming. Watch for confirmation.`;
  }
  return `MACD (${macd.toFixed(2)}) ${crossover} signal (${signal.toFixed(2)}) - potential bearish crossover. Caution warranted.`;
}

export async function fetchXauusdMacd(): Promise<IngestionResult> {
  const now = new Date();
  const observedAt = now.toISOString();
  const observedLabel = formatObservedLabel(now);

  const apiKey = process.env.TWELVE_DATA_API_KEY;

  if (!apiKey) {
    return {
      key: "xauusd-macd",
      status: "error",
      error: "TWELVE_DATA_API_KEY not set",
    };
  }

  try {
    const url = `${TWELVE_DATA_BASE}?symbol=XAU/USD&interval=1h&fast_period=12&slow_period=26&signal_period=9&outputsize=30&apikey=${apiKey}`;
    const response = await rateLimitedTwelveDataFetch(url);

    if (!response.ok) {
      throw new Error(`Twelve Data returned ${response.status}`);
    }

    const data = (await response.json()) as TwelveDataMacdResponse;

    if (data.status === "error") {
      throw new Error(data.message ?? "Twelve Data error");
    }

    if (!data.values || data.values.length === 0) {
      throw new Error("No MACD values returned");
    }

    const latest = data.values[0];
    const macd = parseFloat(latest.macd);
    const signal = parseFloat(latest.macd_signal);
    const hist = parseFloat(latest.macd_hist);

    if (isNaN(macd) || isNaN(signal)) {
      throw new Error(`Invalid MACD values: macd=${latest.macd}, signal=${latest.macd_signal}`);
    }

    // Extract sparkline: reverse to chronological (oldest first), use MACD line values
    const sparkline = data.values
      .map((v) => parseFloat(v.macd))
      .filter((v) => !isNaN(v))
      .reverse();

    const snapshot: IndicatorSnapshot = {
      key: "xauusd-macd",
      name: "MACD (12,26,9)",
      source: "Twelve Data",
      cadence: "1h",
      value: `${macd.toFixed(2)}`,
      change: `Signal: ${signal.toFixed(2)} | Hist: ${hist >= 0 ? "+" : ""}${hist.toFixed(3)}`,
      status: determineStatus(macd, signal),
      summary: buildSummary(macd, signal, hist),
      observedAt,
      observedLabel,
      dataQuality: "delayed",
      qualityNote: "Fetched from Twelve Data MACD endpoint on the configured 1h interval.",
      sparkline: sparkline.length >= 2 ? sparkline : undefined,
    };

    return { key: snapshot.key, status: "success", data: snapshot };
  } catch (err) {
    return {
      key: "xauusd-macd",
      status: "error",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

