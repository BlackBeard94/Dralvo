import type { IndicatorSnapshot } from "@/data/indicators";

export function extractIndicatorNumericValue(
  snapshot: Pick<IndicatorSnapshot, "key" | "value">,
): number | null {
  if (snapshot.key === "xauusd-sma") {
    const sma50Match = snapshot.value.match(/SMA50:\s*\$?([\d,]+(?:\.\d+)?)/i);
    if (sma50Match) {
      const value = Number.parseFloat(sma50Match[1].replace(/,/g, ""));
      return Number.isFinite(value) ? value : null;
    }
  }

  const match = snapshot.value.match(/-?[\d,]+(?:\.\d+)?/);
  if (!match) return null;

  const value = Number.parseFloat(match[0].replace(/,/g, ""));
  return Number.isFinite(value) ? value : null;
}
