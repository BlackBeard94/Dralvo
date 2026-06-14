import type { IngestionResult } from "@/data/ingestion/types";
import { fetchXauusdSpot } from "@/data/ingestion/fetchers/xauusd-spot";
import { fetchXauusdRsi } from "@/data/ingestion/fetchers/xauusd-rsi";
import { fetchXauusdMacd } from "@/data/ingestion/fetchers/xauusd-macd";
import { fetchXauusdSma } from "@/data/ingestion/fetchers/xauusd-sma";
import { fetchTipsYields } from "@/data/ingestion/fetchers/tips-yields";
import { fetchGoldBtcCorrelation } from "@/data/ingestion/fetchers/gold-btc-correlation";
import { fetchCftcGoldPositioning } from "@/data/ingestion/fetchers/cftc-gold-positioning";
import { fetchComexGoldInventory } from "@/data/ingestion/fetchers/comex-gold-inventory";
import { fetchGldGoldHoldings } from "@/data/ingestion/fetchers/gld-gold-holdings";
import { IMPLEMENTED_DRIVER_SOURCE_REGISTRY } from "@/data/driver-registry";

/** Map of indicator keys to their fetcher functions. */
const fetcherRegistry: Record<string, () => Promise<IngestionResult>> = {
  "xauusd-spot": fetchXauusdSpot,
  "xauusd-rsi": fetchXauusdRsi,
  "xauusd-macd": fetchXauusdMacd,
  "xauusd-sma": fetchXauusdSma,
  "tips-yields": fetchTipsYields,
  "gold-btc-correlation": fetchGoldBtcCorrelation,
  "cftc-gold-positioning": fetchCftcGoldPositioning,
  "comex-gold-inventory": fetchComexGoldInventory,
  "gld-gold-holdings": fetchGldGoldHoldings,
};

export const INGESTION_CADENCE_MINUTES: Record<string, number> = {
  "xauusd-spot": 60,
  "xauusd-rsi": 4 * 60,
  "xauusd-macd": 4 * 60,
  "xauusd-sma": 24 * 60,
  "tips-yields": 24 * 60,
  "gold-btc-correlation": 24 * 60,
  "cftc-gold-positioning": 24 * 60,
  "comex-gold-inventory": 24 * 60,
  "gld-gold-holdings": 24 * 60,
};

const TWELVE_DATA_KEYS = new Set([
  "xauusd-spot",
  "xauusd-rsi",
  "xauusd-macd",
  "xauusd-sma",
  "gold-btc-correlation",
]);

export const DRIVER_INDICATOR_KEYS: Record<string, string> = {
  "xauusd-price-context": "xauusd-spot",
  "tips-real-yield": "tips-yields",
  "cftc-gold-positioning": "cftc-gold-positioning",
  "comex-gold-inventory": "comex-gold-inventory",
  "gld-gold-holdings": "gld-gold-holdings",
};

export type EvidenceCoverageRow = {
  driver_key: string;
  series_key: string;
};

export function getMissingEvidenceIndicatorKeys(rows: EvidenceCoverageRow[]) {
  const available = new Set(
    rows.map((row) => `${row.driver_key}:${row.series_key}`),
  );

  return IMPLEMENTED_DRIVER_SOURCE_REGISTRY.filter((driver) =>
    driver.requiredSeries.some(
      (seriesKey) => !available.has(`${driver.driverKey}:${seriesKey}`),
    ),
  )
    .map((driver) => DRIVER_INDICATOR_KEYS[driver.driverKey])
    .filter((key): key is string => Boolean(key));
}

export function mergeDueAndEvidenceBackfillKeys(
  dueKeys: string[],
  evidenceBackfillKeys: string[],
) {
  const backfill = new Set(evidenceBackfillKeys);
  const merged = dueKeys.filter(
    (key) =>
      !(
        backfill.has("xauusd-spot") &&
        TWELVE_DATA_KEYS.has(key) &&
        key !== "xauusd-spot"
      ),
  );

  for (const key of evidenceBackfillKeys) {
    if (!merged.includes(key)) merged.push(key);
  }

  return merged;
}

/**
 * Fetch all registered indicators in parallel.
 * Uses Promise.allSettled so a single failing fetcher never blocks the others.
 * Fetchers return explicit errors when verified source data is unavailable.
 */
export async function fetchAllIndicators(): Promise<IngestionResult[]> {
  return fetchIndicators(Object.keys(fetcherRegistry));
}

export async function fetchIndicators(keys: string[]): Promise<IngestionResult[]> {
  const settled = await Promise.allSettled(keys.map((key) => fetchIndicator(key)));

  return settled.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    }
    return {
      key: keys[index] ?? "unknown",
      status: "error" as const,
      error: result.reason instanceof Error ? result.reason.message : String(result.reason),
    };
  });
}

/**
 * Fetch a single indicator by its key.
 * Returns an error result if the key is not recognized.
 */
export async function fetchIndicator(key: string): Promise<IngestionResult> {
  const fetcher = fetcherRegistry[key];
  if (!fetcher) {
    return {
      key,
      status: "error",
      error: `Unknown indicator key: "${key}". Valid keys: ${Object.keys(fetcherRegistry).join(", ")}`,
    };
  }
  return fetcher();
}

/** List of all available indicator keys. */
export const INDICATOR_KEYS = Object.keys(fetcherRegistry);

export function getDueIndicatorKeys(
  latestObservedAtByKey: Record<string, string | null | undefined>,
  now = new Date(),
) {
  const nowMs = now.getTime();

  const dueKeys = INDICATOR_KEYS.filter((key) => {
    const observedAt = latestObservedAtByKey[key];
    if (!observedAt) return true;

    const observedMs = Date.parse(observedAt);
    if (!Number.isFinite(observedMs)) return true;

    const cadenceMs = (INGESTION_CADENCE_MINUTES[key] ?? 60) * 60_000;
    return nowMs - observedMs >= cadenceMs;
  });

  const nonTwelveDataKeys = dueKeys.filter((key) => !TWELVE_DATA_KEYS.has(key));
  const twelveDataKeys = dueKeys
    .filter((key) => TWELVE_DATA_KEYS.has(key))
    .sort((a, b) => {
      const urgency = (key: string) => {
        const observedAt = latestObservedAtByKey[key];
        const observedMs = observedAt ? Date.parse(observedAt) : Number.NaN;
        if (!Number.isFinite(observedMs)) return Number.POSITIVE_INFINITY;
        const cadenceMs = (INGESTION_CADENCE_MINUTES[key] ?? 60) * 60_000;
        return (nowMs - observedMs) / cadenceMs;
      };

      return urgency(b) - urgency(a);
    });

  return [...nonTwelveDataKeys, ...twelveDataKeys.slice(0, 1)];
}

// Re-export types for convenience
export type { IngestionResult, FetcherFn } from "@/data/ingestion/types";
export { formatObservedLabel } from "@/data/ingestion/types";
