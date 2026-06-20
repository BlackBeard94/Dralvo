/**
 * Dralvo Tier 3A signal evaluation (pure, testable).
 *
 * Strategy (D1, LONG only) - ALL three must be true to enter:
 *   1. CFTC Managed Money net > 100,000 contracts
 *   2. EMA50 > EMA200 on the daily chart
 *   3. Price pullback <= -1.0% from the 10-day high
 *
 * Exit (Tier 3A version A): SL = entry - 1.5*ATR(14), TP = entry + 3.0*ATR(14).
 *
 * Reference: docs/DRALVO_STRATEGY_SYSTEM.md (Tier 3), docs/PRODUCT_PLAN.md.
 */
import type { CandleOHLC } from "@/data/indicators";

export const TIER3A = {
  cftcThreshold: 100_000,
  emaFast: 50,
  emaSlow: 200,
  pullbackLookback: 10,
  pullbackThresholdPct: -1.0,
  atrPeriod: 14,
  slAtrMultiple: 1.5,
  tpAtrMultiple: 3.0,
} as const;

export type SignalState = "long" | "neutral";
export type Regime = "bullish" | "bearish";

export type DriverCheck = {
  label: string;
  value: number;
  threshold: number;
  met: boolean;
};

export type EntryPlan = {
  entry: number;
  stopLoss: number;
  takeProfit: number;
  atr: number;
};

export type SignalResult = {
  signal: SignalState;
  regime: Regime;
  drivers: {
    cftc: DriverCheck;
    trend: DriverCheck;
    pullback: DriverCheck;
  };
  price: {
    spot: number;
    ema50: number;
    ema200: number;
    high10: number;
  };
  entry: EntryPlan | null;
};

/**
 * Exponential moving average, seeded with the SMA of the first `period` values.
 * Returns the latest EMA value, or NaN if there is not enough data.
 * `values` must be oldest-first.
 */
export function latestEma(values: number[], period: number): number {
  if (period <= 0 || values.length < period) return NaN;
  const k = 2 / (period + 1);
  let sum = 0;
  for (let i = 0; i < period; i++) sum += values[i];
  let ema = sum / period;
  for (let i = period; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
  }
  return ema;
}

/**
 * Wilder's ATR over `period`. `candles` must be oldest-first.
 * Returns the latest ATR, or NaN if there is not enough data.
 */
export function latestAtr(candles: CandleOHLC[], period = 14): number {
  if (candles.length <= period) return NaN;
  const tr: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const { high, low } = candles[i];
    const prevClose = candles[i - 1].close;
    tr.push(
      Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose),
      ),
    );
  }
  if (tr.length < period) return NaN;
  let atr = 0;
  for (let i = 0; i < period; i++) atr += tr[i];
  atr /= period;
  for (let i = period; i < tr.length; i++) {
    atr = (atr * (period - 1) + tr[i]) / period;
  }
  return atr;
}

/**
 * Pullback percentage of the latest close from the highest high over the last
 * `lookback` candles (negative = below the high). `candles` oldest-first.
 */
export function pullbackFromHigh(
  candles: CandleOHLC[],
  lookback: number = TIER3A.pullbackLookback,
): { pct: number; high: number } {
  const window = candles.slice(-lookback);
  const high = Math.max(...window.map((c) => c.high));
  const close = candles[candles.length - 1].close;
  return { pct: ((close - high) / high) * 100, high };
}

/**
 * Evaluate the Tier 3A signal from CFTC Managed Money net + daily candles.
 * `candles` must be oldest-first and contain enough history for EMA200.
 */
export function evaluateTier3A(params: {
  cftcNet: number;
  candles: CandleOHLC[];
}): SignalResult {
  const { cftcNet, candles } = params;
  const closes = candles.map((c) => c.close);
  const spot = closes[closes.length - 1];

  const ema50 = latestEma(closes, TIER3A.emaFast);
  const ema200 = latestEma(closes, TIER3A.emaSlow);
  const { pct: pullbackPct, high: high10 } = pullbackFromHigh(candles);

  const cftcMet = cftcNet > TIER3A.cftcThreshold;
  const trendMet = Number.isFinite(ema50) && Number.isFinite(ema200) && ema50 > ema200;
  const pullbackMet = pullbackPct <= TIER3A.pullbackThresholdPct;

  const regime: Regime = cftcMet && trendMet ? "bullish" : "bearish";
  const signal: SignalState =
    cftcMet && trendMet && pullbackMet ? "long" : "neutral";

  let entry: EntryPlan | null = null;
  if (signal === "long") {
    const atr = latestAtr(candles, TIER3A.atrPeriod);
    if (Number.isFinite(atr)) {
      entry = {
        entry: spot,
        stopLoss: spot - TIER3A.slAtrMultiple * atr,
        takeProfit: spot + TIER3A.tpAtrMultiple * atr,
        atr,
      };
    }
  }

  return {
    signal,
    regime,
    drivers: {
      cftc: {
        label: "CFTC Managed Money net > 100k",
        value: cftcNet,
        threshold: TIER3A.cftcThreshold,
        met: cftcMet,
      },
      trend: {
        label: "EMA50 > EMA200 (D1)",
        value: Number.isFinite(ema50 - ema200) ? ema50 - ema200 : 0,
        threshold: 0,
        met: trendMet,
      },
      pullback: {
        label: "Pullback from 10-day high",
        value: Number.isFinite(pullbackPct) ? Number(pullbackPct.toFixed(2)) : 0,
        threshold: TIER3A.pullbackThresholdPct,
        met: pullbackMet,
      },
    },
    price: { spot, ema50, ema200, high10 },
    entry,
  };
}
