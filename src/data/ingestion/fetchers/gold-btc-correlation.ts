import type { IndicatorSnapshot } from "@/data/indicators";
import type { IngestionResult } from "@/data/ingestion/types";
import { formatObservedLabel } from "@/data/ingestion/types";
import { rateLimitedTwelveDataFetch } from "@/data/ingestion/twelve-data-limiter";

/**
 * Gold-BTC Correlation fetcher.
 *
 * The 30-day rolling Pearson correlation between XAUUSD and BTCUSD is a
 * regime indicator. When correlation is low (<0.3), gold trades on its own
 * macro drivers (real yields, USD, physical demand). When correlation rises
 * above 0.5, gold and BTC move together, often driven by liquidity or
 * risk-on/risk-off dynamics - which can dilute gold's safe-haven role.
 *
 * We use the Twelve Data API (TWELVE_DATA_API_KEY env var) to fetch 30-day
 * price series for both XAU/USD and BTC/USD, then compute the Pearson
 * correlation. Source failures return an explicit ingestion error.
 */

const TWELVE_DATA_BASE = "https://api.twelvedata.com/time_series";

interface TwelveDataValue {
  datetime: string;
  close: string;
}

interface TwelveDataResponse {
  values: TwelveDataValue[];
  status?: string;
  message?: string;
}

/** Compute Pearson correlation coefficient between two arrays. */
function pearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 5) return 0;

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const denom = Math.sqrt(denomX * denomY);
  if (denom === 0) return 0;
  return num / denom;
}

async function fetchTwelveDataSeries(
  symbol: string,
  apiKey: string,
): Promise<number[]> {
  const url = `${TWELVE_DATA_BASE}?symbol=${encodeURIComponent(symbol)}&interval=1day&outputsize=30&apikey=${apiKey}`;
  const response = await rateLimitedTwelveDataFetch(url);

  if (!response.ok) {
    throw new Error(`Twelve Data returned ${response.status} for ${symbol}`);
  }

  const data = (await response.json()) as TwelveDataResponse;

  if (data.status === "error") {
    throw new Error(data.message ?? `Twelve Data error for ${symbol}`);
  }

  if (!data.values || data.values.length === 0) {
    throw new Error(`No data returned for ${symbol}`);
  }

  // Reverse to get chronological order (oldest first), then extract close prices
  return data.values
    .reverse()
    .map((v) => parseFloat(v.close))
    .filter((p) => !isNaN(p) && p > 0);
}

function determineStatus(correlation: number): IndicatorSnapshot["status"] {
  if (correlation < 0.3) return "bullish";
  if (correlation > 0.5) return "bearish";
  return "neutral";
}

function buildSummary(correlation: number): string {
  if (correlation < 0.3) {
    return `Gold-BTC 30d correlation at ${correlation.toFixed(2)} is low - gold is trading on its own macro drivers (real yields, USD, physical demand), reinforcing its diversification role.`;
  }
  if (correlation > 0.5) {
    return `Gold-BTC 30d correlation at ${correlation.toFixed(2)} is elevated - both assets are moving together, likely driven by shared macro/liquidity factors, which dilutes gold's safe-haven signal.`;
  }
  return `Gold-BTC 30d correlation at ${correlation.toFixed(2)} is moderate - gold retains partial independence but traders should monitor for regime shifts.`;
}

export async function fetchGoldBtcCorrelation(): Promise<IngestionResult> {
  const now = new Date();
  const observedAt = now.toISOString();
  const observedLabel = formatObservedLabel(now);

  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    return {
      key: "gold-btc-correlation",
      status: "error",
      error: "TWELVE_DATA_API_KEY not set",
    };
  }

  try {
    const xauPrices = await fetchTwelveDataSeries("XAU/USD", apiKey);
    const btcPrices = await fetchTwelveDataSeries("BTC/USD", apiKey);
    const corr = Math.max(
      -1,
      Math.min(1, pearsonCorrelation(xauPrices, btcPrices)),
    );

    const snapshot: IndicatorSnapshot = {
      key: "gold-btc-correlation",
      name: "Gold-BTC Correlation",
      source: "Twelve Data",
      cadence: "Daily",
      value: corr.toFixed(2),
      change: "30d rolling",
      status: determineStatus(corr),
      summary: buildSummary(corr),
      observedAt,
      observedLabel,
      dataQuality: "delayed",
      qualityNote: "Computed from Twelve Data daily XAU/USD and BTC/USD closes.",
      sparkline: xauPrices.length >= 2 ? xauPrices : undefined,
    };

    return { key: snapshot.key, status: "success", data: snapshot };
  } catch (error) {
    return {
      key: "gold-btc-correlation",
      status: "error",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
