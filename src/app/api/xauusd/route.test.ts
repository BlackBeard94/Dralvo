import { describe, expect, it } from "vitest";

import { parseXauusdCandles } from "./route";

describe("XAUUSD chart API parsing", () => {
  it("returns chronological verified candles", () => {
    expect(
      parseXauusdCandles({
        values: [
          {
            datetime: "2026-06-11 04:00:00",
            open: "4200",
            high: "4220",
            low: "4190",
            close: "4215",
          },
          {
            datetime: "2026-06-11 00:00:00",
            open: "4180",
            high: "4210",
            low: "4170",
            close: "4200",
          },
        ],
      }),
    ).toEqual([
      { open: 4180, high: 4210, low: 4170, close: 4200 },
      { open: 4200, high: 4220, low: 4190, close: 4215 },
    ]);
  });

  it("rejects incomplete data instead of returning demo candles", () => {
    expect(() => parseXauusdCandles({ values: [] })).toThrow(
      "not return enough valid",
    );
  });
});
