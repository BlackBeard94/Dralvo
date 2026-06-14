import { describe, expect, it } from "vitest";

import { extractIndicatorNumericValue } from "./indicator-values";

describe("extractIndicatorNumericValue", () => {
  it("extracts standard formatted indicator values", () => {
    expect(
      extractIndicatorNumericValue({
        key: "xauusd-spot",
        value: "$4,369.80",
      }),
    ).toBe(4369.8);
    expect(
      extractIndicatorNumericValue({
        key: "tips-yields",
        value: "1.82%",
      }),
    ).toBe(1.82);
  });

  it("extracts the SMA 50 value instead of the period number", () => {
    expect(
      extractIndicatorNumericValue({
        key: "xauusd-sma",
        value: "SMA50: $4,312 | SMA200: $4,089",
      }),
    ).toBe(4312);
  });

  it("returns null for non-numeric values", () => {
    expect(
      extractIndicatorNumericValue({
        key: "unknown",
        value: "not available",
      }),
    ).toBeNull();
  });
});
