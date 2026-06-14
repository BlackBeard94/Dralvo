import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildXauusdHistoricalObservations,
  buildXauusdHistoricalUrl,
  fetchXauusdSpot,
  parseXauusdDailyResponse,
  validateXauusdHistoricalYear,
} from "./xauusd-spot";

describe("XAUUSD price-context ingestion", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("computes change from two real daily closes", () => {
    const report = parseXauusdDailyResponse({
      values: [
        { datetime: "2026-06-11", close: "4202.32" },
        { datetime: "2026-06-10", close: "4150.00" },
      ],
    });

    expect(report).toMatchObject({
      latestDate: "2026-06-11",
      previousDate: "2026-06-10",
      price: 4202.32,
      previousClose: 4150,
    });
    expect(report.changePercent).toBeCloseTo(1.2607, 4);
  });

  it("uses one time-series request and emits source-backed evidence", async () => {
    vi.stubEnv("TWELVE_DATA_API_KEY", "test-key");
    const fetchFn = vi.fn().mockResolvedValue(
      Response.json({
        values: [
          { datetime: "2026-06-11", close: "4202.32" },
          { datetime: "2026-06-10", close: "4150.00" },
        ],
      }),
    );

    const result = await fetchXauusdSpot(fetchFn);

    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(fetchFn.mock.calls[0][0]).toContain("outputsize=2");
    expect(result.status).toBe("success");
    if (result.status !== "success") return;
    expect(result.data).toMatchObject({
      value: "$4202.32",
      change: "+1.26%",
      dataQuality: "delayed",
    });
    expect(result.observations).toContainEqual(
      expect.objectContaining({
        driverKey: "xauusd-price-context",
        seriesKey: "xauusd_close_usd",
        numericValue: 4202.32,
      }),
    );
  });

  it("rejects incomplete provider data instead of estimating change", () => {
    expect(() =>
      parseXauusdDailyResponse({
        values: [{ datetime: "2026-06-11", close: "4202.32" }],
      }),
    ).toThrow("two valid XAU/USD closes");
  });

  it("builds one-request yearly history with a real prior close", () => {
    const observations = buildXauusdHistoricalObservations(
      {
        values: [
          { datetime: "2026-01-05", close: "2660" },
          { datetime: "2025-12-31", close: "2650" },
          { datetime: "2026-01-02", close: "2676.50" },
        ],
      },
      2026,
    );

    expect(observations).toHaveLength(4);
    expect(observations).toContainEqual(
      expect.objectContaining({
        seriesKey: "xauusd_daily_change_percent",
        observedAt: "2026-01-02T00:00:00Z",
        numericValue: 1,
        metadata: expect.objectContaining({
          previousObservationDate: "2025-12-31",
          historicalArchiveYear: 2026,
        }),
      }),
    );
  });

  it("builds a single bounded provider request", () => {
    const url = new URL(buildXauusdHistoricalUrl(2026, "test-key"));

    expect(url.searchParams.get("start_date")).toBe("2025-12-01");
    expect(url.searchParams.get("end_date")).toBe("2026-12-31");
    expect(url.searchParams.get("outputsize")).toBe("5000");
    expect(validateXauusdHistoricalYear(2000, 2026)).toBe(2000);
    expect(validateXauusdHistoricalYear(1999, 2026)).toBeNull();
  });
});
