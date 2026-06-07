import type { IndicatorSnapshot } from "@/data/indicators";

/** Result of fetching a single indicator — either success with data or an error. */
export type IngestionResult =
  | {
      key: string;
      status: "success";
      data: IndicatorSnapshot;
    }
  | {
      key: string;
      status: "error";
      error: string;
    };

/** Signature for an individual indicator fetcher function. */
export type FetcherFn = () => Promise<IngestionResult>;

/** Helper: format a Date as a human-readable label like "Jun 7, 2026, 14:30". */
export function formatObservedLabel(date: Date): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const month = months[date.getUTCMonth()];
  const day = date.getUTCDate();
  const year = date.getUTCFullYear();
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  return `${month} ${day}, ${year}, ${hours}:${minutes}`;
}

/** Helper: build a success IngestionResult from an IndicatorSnapshot. */
export function successResult(data: IndicatorSnapshot): IngestionResult {
  return { key: data.key, status: "success", data };
}

/** Helper: build an error IngestionResult for a given indicator key. */
export function errorResult(key: string, error: string): IngestionResult {
  return { key, status: "error", error };
}
