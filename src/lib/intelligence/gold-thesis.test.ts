import { describe, expect, it } from "vitest";

import type { EvidenceRow } from "./gold-thesis";
import { buildGoldThesis } from "./gold-thesis";

function row(
  driver: string,
  series: string,
  value: number,
  observedAt = "2026-06-11T00:00:00Z",
): EvidenceRow {
  return {
    driver_key: driver,
    series_key: series,
    numeric_value: value,
    unit: "test",
    observed_at: observedAt,
    source_url: `https://example.com/${driver}`,
    quality: "verified",
  };
}

const baseline = [
  row("xauusd-price-context", "xauusd_close_usd", 4200),
  row("xauusd-price-context", "xauusd_daily_change_percent", 0.8),
  row("tips-real-yield", "dfii10_yield_percent", 1.8),
  row("tips-real-yield", "dfii10_change_bps", -4),
  row("cftc-gold-positioning", "managed_money_net", 120_000),
  row(
    "cftc-gold-positioning",
    "managed_money_net",
    105_000,
    "2026-06-04T00:00:00Z",
  ),
  row("comex-gold-inventory", "registered_ounces", 10_000_000),
  row("comex-gold-inventory", "registered_net_change_ounces", -100_000),
  row("gld-gold-holdings", "gld_tonnes", 900),
  row("gld-gold-holdings", "gld_holdings_change_tonnes", 1.2),
];

describe("gold thesis engine", () => {
  it("builds a supportive thesis from independent verified drivers", () => {
    const thesis = buildGoldThesis(
      baseline,
      new Date("2026-06-12T00:00:00Z"),
    );

    expect(thesis.state).toBe("supportive");
    expect(thesis.coverage).toEqual({
      available: 5,
      required: 5,
      stale: 0,
      missing: 0,
    });
    expect(thesis.supportingDrivers.map((driver) => driver.driverKey)).toEqual(
      expect.arrayContaining([
        "tips-real-yield",
        "cftc-gold-positioning",
        "comex-gold-inventory",
        "gld-gold-holdings",
      ]),
    );
    expect(thesis.priceRelationship).toMatchObject({
      state: "confirming",
      priceDirection: "supportive",
      fundamentalDirection: "supportive",
    });
    expect(thesis.tradeSimulation).toMatchObject({
      action: "simulated_buy",
      bias: "bullish",
      priceBasis: 4200,
    });
    expect(thesis.tradeSimulation.entryZone).toEqual({
      from: 4189.5,
      to: 4202.1,
    });
  });

  it("flags price divergence without predicting how it resolves", () => {
    const rows = baseline.map((item) =>
      item.series_key === "xauusd_daily_change_percent"
        ? { ...item, numeric_value: -0.8 }
        : item,
    );

    const thesis = buildGoldThesis(rows, new Date("2026-06-12T00:00:00Z"));

    expect(thesis.state).toBe("supportive");
    expect(thesis.priceRelationship).toMatchObject({
      state: "diverging",
      priceDirection: "adverse",
      fundamentalDirection: "supportive",
    });
    expect(thesis.priceRelationship?.summary).toContain(
      "without assuming how it will resolve",
    );
    expect(thesis.tradeSimulation.action).toBe("stand_aside");
  });

  it("returns insufficient data instead of inferring missing drivers", () => {
    const thesis = buildGoldThesis(
      baseline.filter(
        (item) =>
          item.driver_key === "xauusd-price-context" ||
          item.driver_key === "tips-real-yield",
      ),
      new Date("2026-06-12T00:00:00Z"),
    );

    expect(thesis.state).toBe("insufficient_data");
    expect(thesis.missingDrivers).toHaveLength(3);
    expect(thesis.priceRelationship?.state).toBe("insufficient_data");
    expect(thesis.tradeSimulation.action).toBe("stand_aside");
  });

  it("excludes stale source observations from the thesis score", () => {
    const thesis = buildGoldThesis(
      baseline,
      new Date("2026-07-20T00:00:00Z"),
    );

    expect(thesis.state).toBe("insufficient_data");
    expect(thesis.staleDrivers.length).toBeGreaterThan(0);
  });
});
