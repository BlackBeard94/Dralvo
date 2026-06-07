import type { IngestionResult } from "@/data/ingestion/types";
import { fetchSgePremium } from "@/data/ingestion/fetchers/sge-premium";
import { fetchCotSwapDealer } from "@/data/ingestion/fetchers/cot-swap-dealer";
import { fetchComexInventory } from "@/data/ingestion/fetchers/comex-inventory";
import { fetchEtfFlows } from "@/data/ingestion/fetchers/etf-flows";
import { fetchTipsYields } from "@/data/ingestion/fetchers/tips-yields";
import { fetchGoldBtcCorrelation } from "@/data/ingestion/fetchers/gold-btc-correlation";

/** Map of indicator keys to their fetcher functions. */
const fetcherRegistry: Record<string, () => Promise<IngestionResult>> = {
  "sge-premium": fetchSgePremium,
  "cot-swap-dealer": fetchCotSwapDealer,
  "comex-inventory": fetchComexInventory,
  "etf-flows": fetchEtfFlows,
  "tips-yields": fetchTipsYields,
  "gold-btc-correlation": fetchGoldBtcCorrelation,
};

/**
 * Fetch all 6 indicators in parallel.
 * Uses Promise.allSettled so a single failing fetcher never blocks the others.
 * Each fetcher handles its own error fallback internally, so this should
 * always return 6 success results under normal operation.
 */
export async function fetchAllIndicators(): Promise<IngestionResult[]> {
  const fetchers = Object.values(fetcherRegistry);
  const settled = await Promise.allSettled(fetchers.map((fn) => fn()));

  return settled.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    }
    // If a fetcher itself throws (shouldn't happen with internal error handling),
    // return a structured error result.
    const keys = Object.keys(fetcherRegistry);
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

// Re-export types for convenience
export type { IngestionResult, FetcherFn } from "@/data/ingestion/types";
export { formatObservedLabel } from "@/data/ingestion/types";
