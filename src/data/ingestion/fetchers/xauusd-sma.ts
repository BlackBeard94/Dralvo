import type { IndicatorSnapshot } from "@/data/indicators";
import type { IngestionResult } from "@/data/ingestion/types";
import { formatObservedLabel } from "@/data/ingestion/types";
import { rateLimitedTwelveDataFetch } from "@/data/ingestion/twelve-data-limiter";

/**
 * XAUUSD SMA 50/200 Crossover fetcher.
 *
 * Fetches both SMA 50 and SMA 200 for XAU/USD from Twelve Data and computes
 * the crossover signal. When SMA 50 crosses above SMA 200, it's a "Golden Cross"
 * (bullish). When SMA 50 crosses below SMA 200, it's a "Death Cross" (bearish).
 *
 * Replaces the mock ETF Flows indicator.
 */

const TWELVE_DATA_BASE = "https://api.twelvedata.com/sma";

interface TwelveDataSmaResponse {
  meta?: { symbol: string; indicator: string };
  values?: Array<{ datetime: string; sma: string }>;
  status?: string;
  message?: string;
}

const MAX_ATTEMPTS = 2;
const DEFAULT_RETRY_DELAY_MS = 12_000;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function determineStatus(sma50: number, sma200: number): IndicatorSnapshot["status"] {
  if (sma50 > sma200) return "bullish";
  if (sma50 < sma200) return "bearish";
  return "neutral";
}

function buildSummary(sma50: number, sma200: number, spread: number): string {
  const spreadPct = ((spread / sma200) * 100).toFixed(2);
  if (sma50 > sma200) {
    return `Golden Cross active - SMA 50 ($${sma50.toFixed(0)}) above SMA 200 ($${sma200.toFixed(0)}) by ${spreadPct}%. Long-term uptrend confirmed.`;
  }
  return `Death Cross active - SMA 50 ($${sma50.toFixed(0)}) below SMA 200 ($${sma200.toFixed(0)}) by ${spreadPct}%. Long-term downtrend in play.`;
}

async function fetchSma(period: number, apiKey: string): Promise<{ value: number; series: number[] }> {
  const url = `${TWELVE_DATA_BASE}?symbol=XAU/USD&interval=1day&time_period=${period}&outputsize=30&apikey=${apiKey}`;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await rateLimitedTwelveDataFetch(url, undefined, 15_000);

      if (!response.ok) {
        if (response.status === 429 && attempt < MAX_ATTEMPTS) {
          const retryAfterSeconds = Number.parseInt(
            response.headers.get("retry-after") ?? "",
            10,
          );
          await delay(
            Number.isFinite(retryAfterSeconds)
              ? retryAfterSeconds * 1000
              : DEFAULT_RETRY_DELAY_MS,
          );
          continue;
        }
        throw new Error(`SMA ${period}: Twelve Data returned ${response.status}`);
      }

      const data = (await response.json()) as TwelveDataSmaResponse;

      if (data.status === "error") {
        throw new Error(data.message ?? `SMA ${period}: Twelve Data error`);
      }

      if (!data.values || data.values.length === 0) {
        throw new Error(`SMA ${period}: No values returned`);
      }

      const sma = parseFloat(data.values[0].sma);
      if (isNaN(sma)) {
        throw new Error(`SMA ${period}: Invalid value: ${data.values[0].sma}`);
      }

      // Extract series: reverse to chronological (oldest first)
      const series = data.values
        .map((v) => parseFloat(v.sma))
        .filter((v) => !isNaN(v))
        .reverse();

      return { value: sma, series };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt === MAX_ATTEMPTS) break;
    }
  }

  throw lastError ?? new Error(`SMA ${period}: Unknown fetch error`);
}

export async function fetchXauusdSma(): Promise<IngestionResult> {
  const now = new Date();
  const observedAt = now.toISOString();
  const observedLabel = formatObservedLabel(now);

  const apiKey = process.env.TWELVE_DATA_API_KEY;

  if (!apiKey) {
    return {
      key: "xauusd-sma",
      status: "error",
      error: "TWELVE_DATA_API_KEY not set",
    };
  }

  try {
    const [sma50Result, sma200Result] = await Promise.all([
      fetchSma(50, apiKey),
      fetchSma(200, apiKey),
    ]);

    const sma50 = sma50Result.value;
    const sma200 = sma200Result.value;
    const spread = sma50 - sma200;
    const spreadPct = ((spread / sma200) * 100).toFixed(2);

    const snapshot: IndicatorSnapshot = {
      key: "xauusd-sma",
      name: "SMA 50/200 Crossover",
      source: "Twelve Data",
      cadence: "Daily",
      value: `SMA50: $${sma50.toFixed(0)} | SMA200: $${sma200.toFixed(0)}`,
      change: `Spread: ${spread >= 0 ? "+" : ""}${spreadPct}%`,
      status: determineStatus(sma50, sma200),
      summary: buildSummary(sma50, sma200, spread),
      observedAt,
      observedLabel,
      dataQuality: "delayed",
      qualityNote: "Fetched from Twelve Data daily SMA endpoints.",
      sparkline: sma50Result.series.length >= 2 ? sma50Result.series : undefined,
    };

    return { key: snapshot.key, status: "success", data: snapshot };
  } catch (err) {
    return {
      key: "xauusd-sma",
      status: "error",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

