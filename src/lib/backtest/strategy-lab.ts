import type { MarketCandle, MarketDataTimeframe } from "@/lib/market-data/types";

export type StrategyDirection = "long" | "short" | "both";
export type StrategyTemplate = "ema-cross" | "rsi-reversion" | "breakout";

export type StrategySpec = {
  template: StrategyTemplate;
  direction: StrategyDirection;
  fastEma: number;
  slowEma: number;
  rsiPeriod: number;
  rsiBuyBelow: number;
  rsiSellAbove: number;
  breakoutLookback: number;
  atrPeriod: number;
  stopAtr: number;
  targetAtr: number;
  riskPct: number;
};

export type BacktestTrade = {
  id: number;
  direction: "long" | "short";
  entryTime: string;
  exitTime: string;
  entry: number;
  exit: number;
  pnlPct: number;
  rMultiple: number;
  reason: "target" | "stop" | "signal" | "end";
};

export type BacktestResult = {
  equityCurve: number[];
  trades: BacktestTrade[];
  netReturnPct: number;
  maxDrawdownPct: number;
  winRatePct: number;
  profitFactor: number;
  expectancyR: number;
  totalTrades: number;
  edgeScore: number;
  edgeVerdict: "candidate" | "weak" | "insufficient";
};

const DEFAULT_SPEC: StrategySpec = {
  template: "ema-cross",
  direction: "both",
  fastEma: 20,
  slowEma: 50,
  rsiPeriod: 14,
  rsiBuyBelow: 35,
  rsiSellAbove: 65,
  breakoutLookback: 24,
  atrPeriod: 14,
  stopAtr: 1.5,
  targetAtr: 3,
  riskPct: 1,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function extractFirstNumberAfter(text: string, marker: string) {
  const index = text.indexOf(marker);
  if (index < 0) return null;
  const match = text.slice(index).match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function extractAllNumbers(text: string) {
  return [...text.matchAll(/\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));
}

export function parseStrategyPrompt(prompt: string): StrategySpec {
  const text = prompt.toLowerCase();
  const numbers = extractAllNumbers(text);
  const spec = { ...DEFAULT_SPEC };

  if (text.includes("rsi") || text.includes("oversold") || text.includes("overbought")) {
    spec.template = "rsi-reversion";
    spec.direction = text.includes("sell") && !text.includes("buy") ? "short" : "both";
    spec.rsiBuyBelow = clamp(extractFirstNumberAfter(text, "below") ?? numbers[0] ?? 35, 10, 50);
    spec.rsiSellAbove = clamp(extractFirstNumberAfter(text, "above") ?? numbers[1] ?? 65, 50, 90);
  }

  if (text.includes("breakout") || /\bhigh\b/.test(text) || /\blow\b/.test(text)) {
    spec.template = "breakout";
    spec.direction = text.includes("short") || text.includes("sell") ? "both" : "long";
    spec.breakoutLookback = clamp(numbers[0] ?? 24, 5, 200);
  }

  if (text.includes("ema") || text.includes("ma") || text.includes("cross")) {
    spec.template = "ema-cross";
    const emaNumbers = numbers.filter((number) => number >= 2 && number <= 300);
    spec.fastEma = clamp(Math.min(emaNumbers[0] ?? 20, emaNumbers[1] ?? 50), 2, 100);
    spec.slowEma = clamp(Math.max(emaNumbers[0] ?? 20, emaNumbers[1] ?? 50), spec.fastEma + 1, 300);
  }

  if (text.includes("long only") || (text.includes("buy") && !text.includes("sell"))) {
    spec.direction = "long";
  } else if (text.includes("short only") || (text.includes("sell") && !text.includes("buy"))) {
    spec.direction = "short";
  }

  const stop = extractFirstNumberAfter(text, "sl") ?? extractFirstNumberAfter(text, "stop");
  const target = extractFirstNumberAfter(text, "tp") ?? extractFirstNumberAfter(text, "target");
  const risk = extractFirstNumberAfter(text, "risk");
  if (stop) spec.stopAtr = clamp(stop, 0.3, 8);
  if (target) spec.targetAtr = clamp(target, 0.5, 16);
  if (risk) spec.riskPct = clamp(risk, 0.1, 5);

  return spec;
}

function ema(values: number[], period: number) {
  const multiplier = 2 / (period + 1);
  const output: number[] = [];
  let previous = values[0] ?? 0;
  for (const value of values) {
    previous = value * multiplier + previous * (1 - multiplier);
    output.push(previous);
  }
  return output;
}

function rsi(values: number[], period: number) {
  const output = Array(values.length).fill(50) as number[];
  let avgGain = 0;
  let avgLoss = 0;
  for (let index = 1; index < values.length; index += 1) {
    const change = values[index] - values[index - 1];
    const gain = Math.max(change, 0);
    const loss = Math.max(-change, 0);
    if (index <= period) {
      avgGain += gain / period;
      avgLoss += loss / period;
    } else {
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    output[index] = 100 - 100 / (1 + rs);
  }
  return output;
}

function atr(candles: MarketCandle[], period: number) {
  const ranges = candles.map((candle, index) => {
    const previousClose = candles[index - 1]?.close ?? candle.close;
    return Math.max(
      candle.high - candle.low,
      Math.abs(candle.high - previousClose),
      Math.abs(candle.low - previousClose),
    );
  });
  return ema(ranges, period);
}

function signalAt(
  spec: StrategySpec,
  candles: MarketCandle[],
  index: number,
  fast: number[],
  slow: number[],
  rsiValues: number[],
) {
  if (index < 2) return null;
  if (spec.template === "ema-cross") {
    const crossedUp = fast[index - 1] <= slow[index - 1] && fast[index] > slow[index];
    const crossedDown = fast[index - 1] >= slow[index - 1] && fast[index] < slow[index];
    if (crossedUp && spec.direction !== "short") return "long";
    if (crossedDown && spec.direction !== "long") return "short";
  }

  if (spec.template === "rsi-reversion") {
    if (rsiValues[index] < spec.rsiBuyBelow && spec.direction !== "short") return "long";
    if (rsiValues[index] > spec.rsiSellAbove && spec.direction !== "long") return "short";
  }

  if (spec.template === "breakout" && index > spec.breakoutLookback) {
    const window = candles.slice(index - spec.breakoutLookback, index);
    const high = Math.max(...window.map((candle) => candle.high));
    const low = Math.min(...window.map((candle) => candle.low));
    if (candles[index].close > high && spec.direction !== "short") return "long";
    if (candles[index].close < low && spec.direction !== "long") return "short";
  }

  return null;
}

export function runStrategyBacktest(
  candles: MarketCandle[],
  spec: StrategySpec,
): BacktestResult {
  const close = candles.map((candle) => candle.close);
  const fast = ema(close, spec.fastEma);
  const slow = ema(close, spec.slowEma);
  const rsiValues = rsi(close, spec.rsiPeriod);
  const atrValues = atr(candles, spec.atrPeriod);
  const trades: BacktestTrade[] = [];
  const equityCurve = [10000];
  let equity = 10000;
  let open:
    | {
        direction: "long" | "short";
        entry: number;
        entryTime: string;
        stopDistance: number;
      }
    | null = null;

  for (let index = Math.max(spec.slowEma, spec.atrPeriod, spec.breakoutLookback); index < candles.length; index += 1) {
    const candle = candles[index];
    const signal = signalAt(spec, candles, index, fast, slow, rsiValues);

    if (open) {
      const stopDistance = open.stopDistance;
      const targetDistance = stopDistance * (spec.targetAtr / spec.stopAtr);
      const stop =
        open.direction === "long" ? open.entry - stopDistance : open.entry + stopDistance;
      const target =
        open.direction === "long" ? open.entry + targetDistance : open.entry - targetDistance;
      let exit: number | null = null;
      let reason: BacktestTrade["reason"] = "end";

      if (open.direction === "long") {
        if (candle.low <= stop) {
          exit = stop;
          reason = "stop";
        } else if (candle.high >= target) {
          exit = target;
          reason = "target";
        } else if (signal === "short") {
          exit = candle.close;
          reason = "signal";
        }
      } else if (candle.high >= stop) {
        exit = stop;
        reason = "stop";
      } else if (candle.low <= target) {
        exit = target;
        reason = "target";
      } else if (signal === "long") {
        exit = candle.close;
        reason = "signal";
      }

      if (exit !== null) {
        const priceMove =
          open.direction === "long" ? exit - open.entry : open.entry - exit;
        const rMultiple = priceMove / stopDistance;
        const pnlPct = rMultiple * spec.riskPct;
        equity *= 1 + pnlPct / 100;
        trades.push({
          id: trades.length + 1,
          direction: open.direction,
          entryTime: open.entryTime,
          exitTime: candle.time,
          entry: open.entry,
          exit,
          pnlPct,
          rMultiple,
          reason,
        });
        equityCurve.push(equity);
        open = null;
      }
    }

    if (!open && signal) {
      const stopDistance = Math.max(atrValues[index] * spec.stopAtr, candle.close * 0.0005);
      open = {
        direction: signal,
        entry: candle.close,
        entryTime: candle.time,
        stopDistance,
      };
    }
  }

  if (open && candles.at(-1)) {
    const last = candles.at(-1)!;
    const priceMove = open.direction === "long" ? last.close - open.entry : open.entry - last.close;
    const rMultiple = priceMove / open.stopDistance;
    const pnlPct = rMultiple * spec.riskPct;
    equity *= 1 + pnlPct / 100;
    trades.push({
      id: trades.length + 1,
      direction: open.direction,
      entryTime: open.entryTime,
      exitTime: last.time,
      entry: open.entry,
      exit: last.close,
      pnlPct,
      rMultiple,
      reason: "end",
    });
    equityCurve.push(equity);
  }

  const wins = trades.filter((trade) => trade.rMultiple > 0);
  const grossWin = wins.reduce((sum, trade) => sum + trade.rMultiple, 0);
  const grossLoss = Math.abs(
    trades.filter((trade) => trade.rMultiple <= 0).reduce((sum, trade) => sum + trade.rMultiple, 0),
  );
  const peakDrawdowns = equityCurve.map((value, index) => {
    const peak = Math.max(...equityCurve.slice(0, index + 1));
    return peak === 0 ? 0 : ((peak - value) / peak) * 100;
  });
  const profitFactor = grossLoss === 0 ? grossWin : grossWin / grossLoss;
  const netReturnPct = ((equity - 10000) / 10000) * 100;
  const maxDrawdownPct = Math.max(0, ...peakDrawdowns);
  const expectancyR = trades.length
    ? trades.reduce((sum, trade) => sum + trade.rMultiple, 0) / trades.length
    : 0;
  const rawEdgeScore = Math.round(
    clamp(
      (profitFactor - 1) * 35 +
        expectancyR * 35 +
        Math.min(trades.length / 60, 1) * 20 +
        Math.max(0, 20 - maxDrawdownPct) * 0.5,
      0,
      100,
    ),
  );
  const edgeScore = trades.length < 30 ? Math.min(rawEdgeScore, 40) : rawEdgeScore;
  const edgeVerdict =
    trades.length < 30
      ? "insufficient"
      : profitFactor >= 1.3 && expectancyR > 0.1 && maxDrawdownPct <= 25
        ? "candidate"
        : "weak";

  return {
    equityCurve,
    trades,
    netReturnPct,
    maxDrawdownPct,
    winRatePct: trades.length ? (wins.length / trades.length) * 100 : 0,
    profitFactor,
    expectancyR,
    totalTrades: trades.length,
    edgeScore,
    edgeVerdict,
  };
}

export function buildSampleCandles(
  symbol: string,
  timeframe: MarketDataTimeframe,
  count = 720,
): MarketCandle[] {
  const base =
    symbol === "usdjpy"
      ? 155
      : symbol === "xauusd"
        ? 2340
        : symbol === "xagusd"
          ? 29
          : symbol === "usoil"
            ? 78
            : symbol === "usdcad"
              ? 1.36
              : symbol === "usdchf"
                ? 0.9
                : symbol === "gbpusd"
                  ? 1.27
                  : symbol === "audusd"
                    ? 0.66
                    : symbol === "nzdusd"
                      ? 0.61
                      : 1.08;
  const stepMs =
    timeframe === "1day"
      ? 86_400_000
      : timeframe === "4h"
        ? 14_400_000
        : timeframe === "1h"
          ? 3_600_000
          : timeframe === "15min"
            ? 900_000
            : 300_000;
  const start = Date.now() - count * stepMs;
  let close = base;
  let seed = Array.from(`${symbol}:${timeframe}`).reduce(
    (sum, char) => sum + char.charCodeAt(0),
    17,
  );
  const nextRandom = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const randomSigned = () => nextRandom() * 2 - 1;
  const precision = ["usdjpy", "xauusd", "xagusd", "usoil"].includes(symbol) ? 2 : 5;
  const pipSize =
    symbol === "usdjpy" ? 0.01 : ["xauusd", "xagusd", "usoil"].includes(symbol) ? 0.1 : 0.0001;
  const baseVolatility =
    timeframe === "1day"
      ? 0.0075
      : timeframe === "4h"
        ? 0.0042
        : timeframe === "1h"
          ? 0.0024
          : timeframe === "15min"
            ? 0.00135
            : 0.0008;

  return Array.from({ length: count }, (_, index) => {
    const sessionPulse = 0.75 + Math.abs(Math.sin(index / 19)) * 0.7;
    const volatilityCluster = 0.75 + Math.abs(Math.sin(index / 53 + randomSigned())) * 0.8;
    const drift = Math.sin(index / 97) * base * baseVolatility * 0.1;
    const shock =
      (randomSigned() + randomSigned() * 0.55 + randomSigned() * 0.25) *
      base *
      baseVolatility *
      sessionPulse *
      volatilityCluster;
    const gap = randomSigned() * base * baseVolatility * 0.12;
    const open = Math.max(base * 0.5, close + gap);
    close = Math.max(base * 0.5, open + shock + drift);
    const body = Math.abs(close - open);
    const wickBase = Math.max(body * (0.35 + nextRandom() * 1.8), base * baseVolatility * 0.22);
    const high = Math.max(open, close) + wickBase * (0.35 + nextRandom() * 1.15);
    const low = Math.max(pipSize, Math.min(open, close) - wickBase * (0.35 + nextRandom() * 1.15));

    return {
      time: new Date(start + index * stepMs).toISOString().replace(".000Z", "Z"),
      open: Number(open.toFixed(precision)),
      high: Number(high.toFixed(precision)),
      low: Number(low.toFixed(precision)),
      close: Number(close.toFixed(precision)),
      volume: 850 + Math.round((body / Math.max(base * baseVolatility, pipSize)) * 420 + nextRandom() * 900),
      spread: symbol === "xauusd" ? 24 : symbol === "xagusd" ? 18 : symbol === "usoil" ? 5 : 2,
    };
  });
}
