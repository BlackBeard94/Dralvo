import { describe, expect, it } from "vitest";

import { buildIndicatorHistory } from "./route";

function snapshot(key: string, value: string) {
  return {
    key,
    name: key,
    source: "test",
    cadence: "test",
    value,
    change: "0",
    status: "neutral" as const,
    summary: "test",
    observedAt: "2026-06-11T00:00:00Z",
    observedLabel: "Jun 11",
  };
}

describe("buildIndicatorHistory", () => {
  it("returns chronological numeric history grouped by indicator", () => {
    const history = buildIndicatorHistory([
      {
        indicator_key: "xauusd-spot",
        observed_at: "2026-06-11T02:00:00Z",
        value_json: snapshot("xauusd-spot", "$4,320.00"),
      },
      {
        indicator_key: "xauusd-spot",
        observed_at: "2026-06-11T01:00:00Z",
        value_json: snapshot("xauusd-spot", "$4,300.00"),
      },
      {
        indicator_key: "xauusd-sma",
        observed_at: "2026-06-11T01:00:00Z",
        value_json: snapshot(
          "xauusd-sma",
          "SMA50: $4,312 | SMA200: $4,089",
        ),
      },
    ]);

    expect(history["xauusd-spot"]).toEqual([
      { observedAt: "2026-06-11T01:00:00Z", value: 4300 },
      { observedAt: "2026-06-11T02:00:00Z", value: 4320 },
    ]);
    expect(history["xauusd-sma"]).toEqual([
      { observedAt: "2026-06-11T01:00:00Z", value: 4312 },
    ]);
  });

  it("ignores malformed snapshots", () => {
    const history = buildIndicatorHistory([
      {
        indicator_key: "xauusd-spot",
        observed_at: "2026-06-11T01:00:00Z",
        value_json: { key: "xauusd-spot", value: "broken" },
      },
    ]);

    expect(history).toEqual({});
  });
});
