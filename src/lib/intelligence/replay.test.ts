import { describe, expect, it } from "vitest";

import {
  evidenceAvailableBy,
  replayCutoff,
  type ReplayEvidenceRow,
} from "@/lib/intelligence/replay";

const base: ReplayEvidenceRow = {
  driver_key: "tips-real-yield",
  series_key: "dfii10_yield_percent",
  numeric_value: 1.8,
  unit: "percent",
  observed_at: "2026-06-01T00:00:00Z",
  source_url: "https://example.com",
  quality: "verified",
  released_at: null,
  retrieved_at: "2026-06-02T12:00:00Z",
};

describe("thesis replay availability", () => {
  it("creates an end-of-day UTC cutoff for a valid date", () => {
    expect(replayCutoff("2026-06-02")?.toISOString()).toBe(
      "2026-06-02T23:59:59.999Z",
    );
    expect(replayCutoff("06/02/2026")).toBeNull();
  });

  it("uses release time when known and retrieval time otherwise", () => {
    const cutoff = replayCutoff("2026-06-02")!;
    const available = evidenceAvailableBy(
      [
        base,
        {
          ...base,
          series_key: "late",
          retrieved_at: "2026-06-03T00:00:00Z",
        },
        {
          ...base,
          series_key: "released",
          released_at: "2026-06-02T08:00:00Z",
          retrieved_at: "2026-06-10T00:00:00Z",
        },
      ],
      cutoff,
    );

    expect(available.map((row) => row.series_key)).toEqual([
      "dfii10_yield_percent",
      "released",
    ]);
  });
});
