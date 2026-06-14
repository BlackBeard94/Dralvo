import { describe, expect, it } from "vitest";

import {
  getDueIndicatorKeys,
  getMissingEvidenceIndicatorKeys,
  mergeDueAndEvidenceBackfillKeys,
} from "./index";

describe("getDueIndicatorKeys", () => {
  it("only marks indicators due after their cadence has elapsed", () => {
    const due = getDueIndicatorKeys(
      {
        "xauusd-spot": "2026-06-11T10:44:00Z",
        "xauusd-rsi": "2026-06-11T10:00:00Z",
        "xauusd-macd": "2026-06-11T10:15:00Z",
        "xauusd-sma": "2026-06-10T10:44:00Z",
        "tips-yields": "2026-06-11T00:00:00Z",
        "gold-btc-correlation": "2026-06-11T10:40:00Z",
        "cftc-gold-positioning": "2026-06-11T00:00:00Z",
        "comex-gold-inventory": "2026-06-11T00:00:00Z",
        "gld-gold-holdings": "2026-06-11T00:00:00Z",
      },
      new Date("2026-06-11T11:00:00Z"),
    );

    expect(due).toEqual(["xauusd-sma"]);
  });

  it("marks missing or invalid timestamps as due", () => {
    const due = getDueIndicatorKeys(
      {
        "xauusd-spot": null,
        "xauusd-rsi": "invalid",
        "cftc-gold-positioning": "2026-06-11T00:00:00Z",
        "comex-gold-inventory": "2026-06-11T00:00:00Z",
        "gld-gold-holdings": "2026-06-11T00:00:00Z",
      },
      new Date("2026-06-11T11:00:00Z"),
    );

    expect(due).toEqual(["tips-yields", "xauusd-spot"]);
  });

  it("allows non-Twelve Data indicators alongside one Twelve Data indicator", () => {
    const due = getDueIndicatorKeys(
      {
        "xauusd-spot": "2026-06-11T09:00:00Z",
        "tips-yields": "2026-06-10T09:00:00Z",
        "gld-gold-holdings": "2026-06-11T09:00:00Z",
      },
      new Date("2026-06-11T11:00:00Z"),
    );

    expect(due).toContain("tips-yields");
    expect(due.filter((key) => key.startsWith("xauusd") || key === "gold-btc-correlation")).toHaveLength(1);
  });
});

describe("evidence backfill scheduling", () => {
  it("forces drivers with missing required evidence series", () => {
    const keys = getMissingEvidenceIndicatorKeys([
      { driver_key: "xauusd-price-context", series_key: "xauusd_close_usd" },
      {
        driver_key: "tips-real-yield",
        series_key: "dfii10_yield_percent",
      },
      { driver_key: "tips-real-yield", series_key: "dfii10_change_bps" },
    ]);

    expect(keys).toContain("xauusd-spot");
    expect(keys).not.toContain("tips-yields");
    expect(keys).toContain("cftc-gold-positioning");
    expect(keys).toContain("comex-gold-inventory");
    expect(keys).toContain("gld-gold-holdings");
  });

  it("prioritizes missing XAUUSD evidence over other Twelve Data work", () => {
    const keys = mergeDueAndEvidenceBackfillKeys(
      ["xauusd-rsi", "tips-yields"],
      ["xauusd-spot"],
    );

    expect(keys).toEqual(["tips-yields", "xauusd-spot"]);
  });
});
