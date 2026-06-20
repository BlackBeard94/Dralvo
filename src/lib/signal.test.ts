import { describe, expect, it } from "vitest";

import type { CandleOHLC } from "@/data/indicators";
import {
  evaluateTier3A,
  latestAtr,
  latestEma,
  pullbackFromHigh,
} from "@/lib/signal";

/** Build a flat candle (high=low=close) for simple EMA/pullback tests. */
function flat(close: number): CandleOHLC {
  return { open: close, high: close, low: close, close };
}

describe("latestEma", () => {
  it("returns NaN when not enough data", () => {
    expect(latestEma([1, 2, 3], 5)).toBeNaN();
  });

  it("equals the constant value for a flat series", () => {
    const flatSeries = new Array(60).fill(100);
    expect(latestEma(flatSeries, 50)).toBeCloseTo(100, 6);
  });

  it("rises when recent values rise", () => {
    const rising = Array.from({ length: 60 }, (_, i) => 100 + i);
    const ema = latestEma(rising, 50);
    expect(ema).toBeGreaterThan(100);
    expect(ema).toBeLessThan(159);
  });
});

describe("latestAtr", () => {
  it("returns NaN with insufficient candles", () => {
    expect(latestAtr([flat(1), flat(2)], 14)).toBeNaN();
  });

  it("is zero for a perfectly flat market", () => {
    const candles = new Array(30).fill(0).map(() => flat(2000));
    expect(latestAtr(candles, 14)).toBeCloseTo(0, 6);
  });

  it("reflects a constant true range", () => {
    // Each candle has a 10-wide range and no gaps -> ATR ~ 10.
    const candles: CandleOHLC[] = new Array(30).fill(0).map(() => ({
      open: 2000,
      high: 2005,
      low: 1995,
      close: 2000,
    }));
    expect(latestAtr(candles, 14)).toBeCloseTo(10, 6);
  });
});

describe("pullbackFromHigh", () => {
  it("computes negative pullback below the recent high", () => {
    const candles = [
      flat(100),
      flat(110),
      { open: 110, high: 110, low: 99, close: 99 },
    ];
    const { pct, high } = pullbackFromHigh(candles, 3);
    expect(high).toBe(110);
    expect(pct).toBeCloseTo((99 - 110) / 110 * 100, 6); // -10%
  });
});

describe("evaluateTier3A", () => {
  // 220 rising daily closes -> EMA50 > EMA200 (uptrend).
  const uptrend: CandleOHLC[] = Array.from({ length: 220 }, (_, i) => {
    const close = 1000 + i * 2;
    return { open: close, high: close + 5, low: close - 5, close };
  });

  it("fires LONG when CFTC bullish, uptrend, and price pulls back", () => {
    // Force a pullback: last candle drops well below the 10-day high.
    const candles = uptrend.slice();
    const lastClose = 1000 + 219 * 2; // ~1438
    candles[candles.length - 1] = {
      open: lastClose,
      high: lastClose,
      low: lastClose - 30,
      close: lastClose - 30, // ~-2% from recent high
    };
    const r = evaluateTier3A({ cftcNet: 150_000, candles });
    expect(r.drivers.cftc.met).toBe(true);
    expect(r.drivers.trend.met).toBe(true);
    expect(r.drivers.pullback.met).toBe(true);
    expect(r.signal).toBe("long");
    expect(r.regime).toBe("bullish");
    expect(r.entry).not.toBeNull();
    expect(r.entry!.stopLoss).toBeLessThan(r.entry!.entry);
    expect(r.entry!.takeProfit).toBeGreaterThan(r.entry!.entry);
  });

  it("stands aside (neutral) when CFTC is below threshold", () => {
    const r = evaluateTier3A({ cftcNet: 50_000, candles: uptrend });
    expect(r.drivers.cftc.met).toBe(false);
    expect(r.signal).toBe("neutral");
    expect(r.regime).toBe("bearish");
    expect(r.entry).toBeNull();
  });

  it("stands aside when there is no pullback (price at highs)", () => {
    // uptrend's last candle is at the high -> pullback ~0%.
    const r = evaluateTier3A({ cftcNet: 150_000, candles: uptrend });
    expect(r.drivers.trend.met).toBe(true);
    expect(r.drivers.pullback.met).toBe(false);
    expect(r.signal).toBe("neutral");
  });
});
