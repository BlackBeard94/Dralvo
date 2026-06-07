export type IndicatorStatus = "bullish" | "neutral" | "bearish";

export type IndicatorSnapshot = {
  key: string;
  name: string;
  source: string;
  cadence: string;
  value: string;
  change: string;
  status: IndicatorStatus;
  summary: string;
  observedAt: string;
  observedLabel: string;
};

export const indicatorSnapshots: IndicatorSnapshot[] = [
  {
    key: "sge-premium",
    name: "SGE Premium",
    source: "Shanghai Gold Exchange + XAUUSD spot",
    cadence: "1m target",
    value: "+$36.40/oz",
    change: "+4.8%",
    status: "bullish",
    summary: "China physical demand remains above international spot pricing.",
    observedAt: "2026-06-06T12:00:00Z",
    observedLabel: "Jun 6, 2026",
  },
  {
    key: "cot-swap-dealer",
    name: "COT Swap Dealer",
    source: "CFTC COT report",
    cadence: "Weekly",
    value: "Net short rising",
    change: "+8.2k contracts",
    status: "bullish",
    summary: "Dealer hedging suggests institutional accumulation beneath price action.",
    observedAt: "2026-06-06T12:00:00Z",
    observedLabel: "Jun 6, 2026",
  },
  {
    key: "comex-inventory",
    name: "COMEX Inventory",
    source: "CME vault data",
    cadence: "Daily",
    value: "Registered tight",
    change: "-2.1%",
    status: "bullish",
    summary: "Deliverable inventory remains tight versus recent delivery demand.",
    observedAt: "2026-06-06T12:00:00Z",
    observedLabel: "Jun 6, 2026",
  },
  {
    key: "etf-flows",
    name: "ETF Flows",
    source: "WGC + ETF issuers",
    cadence: "Daily",
    value: "+11.8t",
    change: "3-day inflow",
    status: "neutral",
    summary: "ETF demand has stabilized after recent outflow pressure.",
    observedAt: "2026-06-06T12:00:00Z",
    observedLabel: "Jun 6, 2026",
  },
  {
    key: "tips-yields",
    name: "TIPS Yields",
    source: "US Treasury + FRED",
    cadence: "Daily",
    value: "1.82%",
    change: "-6 bps",
    status: "bullish",
    summary: "Real yields eased, reducing macro pressure on gold.",
    observedAt: "2026-06-06T12:00:00Z",
    observedLabel: "Jun 6, 2026",
  },
  {
    key: "gold-btc-correlation",
    name: "Gold-BTC Correlation",
    source: "Twelve Data + Binance",
    cadence: "5m target",
    value: "0.24",
    change: "30d rolling",
    status: "neutral",
    summary: "Correlation remains low enough for gold to trade on its own drivers.",
    observedAt: "2026-06-06T12:00:00Z",
    observedLabel: "Jun 6, 2026",
  },
];

/** Realistic XAUUSD 4H candle data — OHLC format.
 *  Price range anchored around ~$4,345 (June 2026 spot).
 *  Each candle: open, high, low, close.
 *  Bullish = close > open, Bearish = close < open.
 */
export type CandleOHLC = {
  open: number;
  high: number;
  low: number;
  close: number;
};

export const dashboardCandles: CandleOHLC[] = [
  { open: 4312.5, high: 4328.7, low: 4308.1, close: 4326.3 },
  { open: 4326.3, high: 4331.2, low: 4319.8, close: 4321.4 },
  { open: 4321.4, high: 4335.6, low: 4317.0, close: 4333.9 },
  { open: 4333.9, high: 4348.2, low: 4330.5, close: 4345.8 },
  { open: 4345.8, high: 4352.1, low: 4338.4, close: 4340.2 },
  { open: 4340.2, high: 4346.9, low: 4329.7, close: 4332.5 },
  { open: 4332.5, high: 4344.3, low: 4328.0, close: 4341.8 },
  { open: 4341.8, high: 4358.6, low: 4339.2, close: 4355.1 },
  { open: 4355.1, high: 4362.4, low: 4348.9, close: 4350.7 },
  { open: 4350.7, high: 4357.3, low: 4342.1, close: 4345.0 },
  { open: 4345.0, high: 4351.8, low: 4336.5, close: 4339.2 },
  { open: 4339.2, high: 4348.0, low: 4333.4, close: 4344.6 },
  { open: 4344.6, high: 4360.5, low: 4341.2, close: 4357.9 },
  { open: 4357.9, high: 4365.3, low: 4350.8, close: 4353.2 },
  { open: 4353.2, high: 4359.7, low: 4344.0, close: 4347.5 },
  { open: 4347.5, high: 4355.2, low: 4340.3, close: 4342.8 },
  { open: 4342.8, high: 4352.6, low: 4338.1, close: 4349.4 },
  { open: 4349.4, high: 4364.8, low: 4346.0, close: 4361.2 },
  { open: 4361.2, high: 4368.5, low: 4354.7, close: 4358.3 },
  { open: 4358.3, high: 4366.1, low: 4351.9, close: 4354.0 },
  { open: 4354.0, high: 4362.8, low: 4348.5, close: 4359.6 },
  { open: 4359.6, high: 4372.4, low: 4356.3, close: 4368.9 },
  { open: 4368.9, high: 4375.2, low: 4362.1, close: 4365.7 },
  { open: 4365.7, high: 4371.0, low: 4357.4, close: 4360.1 },
  { open: 4360.1, high: 4367.5, low: 4353.8, close: 4356.4 },
  { open: 4356.4, high: 4364.2, low: 4350.6, close: 4361.8 },
  { open: 4361.8, high: 4374.9, low: 4358.0, close: 4371.3 },
  { open: 4371.3, high: 4378.6, low: 4365.4, close: 4368.2 },
  { open: 4368.2, high: 4375.1, low: 4360.9, close: 4363.5 },
  { open: 4363.5, high: 4372.0, low: 4358.7, close: 4369.8 },
];

/** Current XAUUSD spot price (June 2026) */
export const XAUUSD_SPOT = 4369.8;
export const XAUUSD_SPOT_LABEL = "4,369.80";
