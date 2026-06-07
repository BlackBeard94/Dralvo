/**
 * Mock Data Generator — Phase 1
 *
 * Produces time-varying indicator snapshots that simulate real-time updates.
 * Each indicator has its own drift model, cadence, and value range.
 *
 * Phase 2 will replace this with scheduled ingestion from real data sources.
 */

import type { IndicatorSnapshot, IndicatorStatus } from "./indicators";

/* ─── Seeded PRNG (mulberry32) ─── */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ─── Indicator drift models ─── */
interface DriftModel {
  baseValue: number;
  volatility: number; // max change per tick
  trend: number; // directional bias (-1 to 1)
  format: (v: number) => string;
  changeFormat: (v: number) => string;
  statusFromValue: (v: number) => IndicatorStatus;
}

const driftModels: Record<string, DriftModel> = {
  "sge-premium": {
    baseValue: 36.4,
    volatility: 2.5,
    trend: 0.15,
    format: (v) => `+$${v.toFixed(2)}/oz`,
    changeFormat: (v) => (v >= 0 ? `+${v.toFixed(1)}%` : `${v.toFixed(1)}%`),
    statusFromValue: (v) => (v > 30 ? "bullish" : v > 15 ? "neutral" : "bearish"),
  },
  "cot-swap-dealer": {
    baseValue: 8.2,
    volatility: 3.0,
    trend: 0.1,
    format: (v) => (v >= 0 ? `Net short rising` : `Net short falling`),
    changeFormat: (v) => (v >= 0 ? `+${v.toFixed(1)}k contracts` : `${v.toFixed(1)}k contracts`),
    statusFromValue: (v) => (v > 5 ? "bullish" : v > -5 ? "neutral" : "bearish"),
  },
  "comex-inventory": {
    baseValue: -2.1,
    volatility: 1.8,
    trend: -0.2,
    format: (v) => (v < -3 ? "Registered tight" : v < -1 ? "Registered moderate" : "Registered ample"),
    changeFormat: (v) => (v >= 0 ? `+${v.toFixed(1)}%` : `${v.toFixed(1)}%`),
    statusFromValue: (v) => (v < -2 ? "bullish" : v < 0 ? "neutral" : "bearish"),
  },
  "etf-flows": {
    baseValue: 11.8,
    volatility: 4.0,
    trend: 0.05,
    format: (v) => (v >= 0 ? `+${v.toFixed(1)}t` : `${v.toFixed(1)}t`),
    changeFormat: (v) => {
      if (v > 0) return `${Math.ceil(v)}-day inflow`;
      if (v < 0) return `${Math.ceil(Math.abs(v))}-day outflow`;
      return "flat";
    },
    statusFromValue: (v) => (v > 8 ? "bullish" : v > -5 ? "neutral" : "bearish"),
  },
  "tips-yields": {
    baseValue: 1.82,
    volatility: 0.08,
    trend: -0.3,
    format: (v) => `${v.toFixed(2)}%`,
    changeFormat: (v) => (v >= 0 ? `+${Math.round(v * 100)} bps` : `${Math.round(v * 100)} bps`),
    statusFromValue: (v) => (v < 1.7 ? "bullish" : v < 2.0 ? "neutral" : "bearish"),
  },
  "gold-btc-correlation": {
    baseValue: 0.24,
    volatility: 0.06,
    trend: -0.1,
    format: (v) => v.toFixed(2),
    changeFormat: () => "30d rolling",
    statusFromValue: (v) => (v < 0.3 ? "bullish" : v < 0.5 ? "neutral" : "bearish"),
  },
};

/* ─── Indicator metadata (static) ─── */
const indicatorMeta: Record<string, Omit<IndicatorSnapshot, "value" | "change" | "status" | "summary" | "observedAt" | "observedLabel">> = {
  "sge-premium": {
    key: "sge-premium",
    name: "SGE Premium",
    source: "Shanghai Gold Exchange + XAUUSD spot",
    cadence: "1m target",
  },
  "cot-swap-dealer": {
    key: "cot-swap-dealer",
    name: "COT Swap Dealer",
    source: "CFTC COT report",
    cadence: "Weekly",
  },
  "comex-inventory": {
    key: "comex-inventory",
    name: "COMEX Inventory",
    source: "CME vault data",
    cadence: "Daily",
  },
  "etf-flows": {
    key: "etf-flows",
    name: "ETF Flows",
    source: "WGC + ETF issuers",
    cadence: "Daily",
  },
  "tips-yields": {
    key: "tips-yields",
    name: "TIPS Yields",
    source: "US Treasury + FRED",
    cadence: "Daily",
  },
  "gold-btc-correlation": {
    key: "gold-btc-correlation",
    name: "Gold-BTC Correlation",
    source: "Twelve Data + Binance",
    cadence: "5m target",
  },
};

/* ─── Summary templates ─── */
const summaryTemplates: Record<string, (v: number) => string> = {
  "sge-premium": (v) =>
    v > 30
      ? "China physical demand remains above international spot pricing."
      : v > 15
        ? "Shanghai premium narrowing but still positive."
        : "Physical demand in Shanghai has cooled toward international parity.",
  "cot-swap-dealer": (v) =>
    v > 5
      ? "Dealer hedging suggests institutional accumulation beneath price action."
      : v > -5
        ? "Swap dealer positioning is neutral — no strong directional signal."
        : "Dealer short positioning suggests institutional distribution.",
  "comex-inventory": (v) =>
    v < -2
      ? "Deliverable inventory remains tight versus recent delivery demand."
      : v < 0
        ? "Registered inventory is moderate — no immediate squeeze risk."
        : "COMEX vaults are well-stocked relative to open interest.",
  "etf-flows": (v) =>
    v > 8
      ? "Strong ETF inflows signal renewed institutional appetite for gold exposure."
      : v > -5
        ? "ETF demand has stabilized after recent outflow pressure."
        : "Sustained ETF outflows suggest rotation away from gold.",
  "tips-yields": (v) =>
    v < 1.7
      ? "Real yields eased, reducing macro pressure on gold."
      : v < 2.0
        ? "Real yields are range-bound — neutral for gold."
        : "Rising real yields increase the opportunity cost of holding gold.",
  "gold-btc-correlation": (v) =>
    v < 0.3
      ? "Correlation remains low enough for gold to trade on its own drivers."
      : v < 0.5
        ? "Moderate correlation — watch for cross-asset spillover."
        : "High correlation suggests macro-driven moves across both assets.",
};

/* ─── Generator state ─── */
const state = new Map<string, { value: number; rng: () => number; tickCount: number }>();

function getOrInitState(key: string) {
  if (!state.has(key)) {
    const model = driftModels[key];
    if (!model) throw new Error(`Unknown indicator key: ${key}`);
    const seed = Array.from(key).reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 2166136261);
    state.set(key, {
      value: model.baseValue,
      rng: mulberry32(seed),
      tickCount: 0,
    });
  }
  return state.get(key)!;
}

/* ─── Public API ─── */

/** Advance one indicator by one tick and return the updated snapshot. */
export function tickIndicator(key: string): IndicatorSnapshot {
  const model = driftModels[key];
  if (!model) throw new Error(`Unknown indicator key: ${key}`);
  const meta = indicatorMeta[key];
  const s = getOrInitState(key);

  s.tickCount++;

  // Random walk with trend bias
  const noise = (s.rng() - 0.5) * 2 * model.volatility;
  const drift = model.trend * model.volatility * 0.3;
  s.value += noise + drift;

  // Clamp to reasonable ranges
  s.value = Math.max(model.baseValue - model.volatility * 5, Math.min(model.baseValue + model.volatility * 5, s.value));

  const now = new Date();
  const changePct = model.baseValue !== 0 ? ((s.value - model.baseValue) / Math.abs(model.baseValue)) * 100 : 0;

  return {
    ...meta,
    value: model.format(s.value),
    change: model.changeFormat(changePct),
    status: model.statusFromValue(s.value),
    summary: summaryTemplates[key](s.value),
    observedAt: now.toISOString(),
    observedLabel: now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

/** Tick all 6 indicators and return the full snapshot array. */
export function tickAllIndicators(): IndicatorSnapshot[] {
  return Object.keys(driftModels).map(tickIndicator);
}

/** Reset all indicator state to base values. */
export function resetMockState(): void {
  state.clear();
}

/** Get current values without advancing. */
export function getCurrentSnapshots(): IndicatorSnapshot[] {
  return Object.keys(driftModels).map((key) => {
    const model = driftModels[key];
    const meta = indicatorMeta[key];
    const s = getOrInitState(key);
    const changePct = model.baseValue !== 0 ? ((s.value - model.baseValue) / Math.abs(model.baseValue)) * 100 : 0;
    const now = new Date();

    return {
      ...meta,
      value: model.format(s.value),
      change: model.changeFormat(changePct),
      status: model.statusFromValue(s.value),
      summary: summaryTemplates[key](s.value),
      observedAt: now.toISOString(),
      observedLabel: now.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  });
}

/** Cadence intervals in milliseconds for each indicator. */
export const indicatorCadenceMs: Record<string, number> = {
  "sge-premium": 60_000, // 1 minute
  "cot-swap-dealer": 604_800_000, // 1 week (but we tick it every 30s for demo)
  "comex-inventory": 86_400_000, // 1 day (tick every 60s for demo)
  "etf-flows": 86_400_000, // 1 day (tick every 60s for demo)
  "tips-yields": 86_400_000, // 1 day (tick every 45s for demo)
  "gold-btc-correlation": 300_000, // 5 minutes
};

/** Demo-mode cadence (accelerated for visual effect). */
export const demoCadenceMs: Record<string, number> = {
  "sge-premium": 8_000, // 8 seconds
  "cot-swap-dealer": 30_000, // 30 seconds
  "comex-inventory": 25_000, // 25 seconds
  "etf-flows": 20_000, // 20 seconds
  "tips-yields": 18_000, // 18 seconds
  "gold-btc-correlation": 12_000, // 12 seconds
};
