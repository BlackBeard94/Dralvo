import { describe, expect, it } from "vitest";

import { candlesToCsv, parseMarketCandlesCsv } from "./csv";

describe("market data csv", () => {
  it("parses normalized candle csv", () => {
    const candles = parseMarketCandlesCsv(
      [
        "time,open,high,low,close,volume,spread",
        "2026-06-18T00:00:00Z,2300,2310,2290,2305,100,12",
      ].join("\n"),
    );

    expect(candles).toEqual([
      {
        time: "2026-06-18T00:00:00Z",
        open: 2300,
        high: 2310,
        low: 2290,
        close: 2305,
        volume: 100,
        spread: 12,
      },
    ]);
  });

  it("parses common MT5/Dukascopy style headers", () => {
    const candles = parseMarketCandlesCsv(
      [
        "<DATE>,<OPEN>,<HIGH>,<LOW>,<CLOSE>,<TICKVOL>,<SPREAD>",
        "2026-06-18 12:00,1.15000,1.15200,1.14900,1.15100,42,4",
      ].join("\n"),
    );

    expect(candles[0]).toMatchObject({
      time: "2026-06-18T12:00:00Z",
      open: 1.15,
      high: 1.152,
      low: 1.149,
      close: 1.151,
      volume: 42,
      spread: 4,
    });
  });

  it("serializes candles back to normalized csv", () => {
    expect(
      candlesToCsv([
        {
          time: "2026-06-18T00:00:00Z",
          open: 1,
          high: 2,
          low: 0.5,
          close: 1.5,
          volume: null,
          spread: null,
        },
      ]),
    ).toBe("time,open,high,low,close,volume,spread\n2026-06-18T00:00:00Z,1,2,0.5,1.5,,\n");
  });
});
