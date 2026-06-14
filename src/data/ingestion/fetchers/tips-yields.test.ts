import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildFredTipsHistoricalObservations,
  buildFredTipsHistoricalUrl,
  fetchTipsYields,
  parseFredTipsResponse,
  validateFredTipsHistoricalYear,
} from "./tips-yields";

describe("TIPS real-yield ingestion", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("skips missing FRED values and computes the published change", () => {
    expect(
      parseFredTipsResponse({
        observations: [
          { date: "2026-06-12", value: "." },
          { date: "2026-06-11", value: "1.81" },
          { date: "2026-06-10", value: "1.84" },
        ],
      }),
    ).toEqual({
      latestDate: "2026-06-11",
      previousDate: "2026-06-10",
      yieldPercent: 1.81,
      previousYieldPercent: 1.84,
      changeBps: -3,
    });
  });

  it("returns evidence from FRED without an estimated fallback", async () => {
    vi.stubEnv("FRED_API_KEY", "test-key");
    const fetchFn = vi.fn().mockResolvedValue(
      Response.json({
        observations: [
          { date: "2026-06-11", value: "1.81" },
          { date: "2026-06-10", value: "1.84" },
        ],
      }),
    );

    const result = await fetchTipsYields(fetchFn);

    expect(result.status).toBe("success");
    if (result.status !== "success") return;
    expect(result.data).toMatchObject({
      observedAt: "2026-06-11T00:00:00Z",
      change: "-3 bps",
      dataQuality: "delayed",
    });
    expect(result.observations).toContainEqual(
      expect.objectContaining({
        driverKey: "tips-real-yield",
        seriesKey: "dfii10_yield_percent",
        numericValue: 1.81,
      }),
    );
  });

  it("returns an error when FRED is not configured", async () => {
    vi.stubEnv("FRED_API_KEY", "");
    await expect(fetchTipsYields()).resolves.toMatchObject({
      status: "error",
      error: "FRED_API_KEY not set",
    });
  });

  it("builds yearly history while using the prior valid observation for change", () => {
    const observations = buildFredTipsHistoricalObservations(
      {
        observations: [
          { date: "2025-12-31", value: "1.90" },
          { date: "2026-01-02", value: "1.87" },
          { date: "2026-01-05", value: "." },
          { date: "2026-01-06", value: "1.89" },
        ],
      },
      2026,
    );

    expect(observations).toHaveLength(4);
    expect(observations).toContainEqual(
      expect.objectContaining({
        seriesKey: "dfii10_change_bps",
        observedAt: "2026-01-02T00:00:00Z",
        numericValue: -3,
        metadata: expect.objectContaining({
          previousObservationDate: "2025-12-31",
          historicalArchiveYear: 2026,
        }),
      }),
    );
  });

  it("builds a bounded FRED URL and validates supported years", () => {
    const url = new URL(buildFredTipsHistoricalUrl(2026, "test-key"));

    expect(url.searchParams.get("observation_start")).toBe("2025-12-01");
    expect(url.searchParams.get("observation_end")).toBe("2026-12-31");
    expect(url.searchParams.get("sort_order")).toBe("asc");
    expect(validateFredTipsHistoricalYear(2003, 2026)).toBe(2003);
    expect(validateFredTipsHistoricalYear(2002, 2026)).toBeNull();
  });
});
