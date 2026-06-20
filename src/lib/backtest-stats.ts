/**
 * Canonical Dralvo backtest numbers — see PRODUCT_PLAN.md §0.
 *
 * Dralvo sells TWO EAs in parallel; each is marketed with its OWN verified MT5
 * backtest (no mixing of numbers). Display values are kept as ready-to-render
 * strings; descriptive labels live in i18n (LANDING_COPY). Numbers are
 * locale-neutral so they are stored here once.
 *
 * Sources:
 *  - GoldMaster: E:\EA Dralvo\Dralvo GoldMaster\marketing\assets\BaoCao_HieuSuat_Backtest.html
 *  - Gold Scalp: E:\EA Dralvo\Dralvo Gold Scalp\marketing\assets\BaoCao_HieuSuat_Backtest.html
 */

export type EaAccent = "gold" | "steel";

export type RiskRow = {
  risk: string;
  ret: string;
  ddEquity: string;
  pf: string;
  /** GoldMaster: CAGR; Scalp: trade count. Rendered under a copy-provided label. */
  extra: string;
  star?: boolean;
};

export type EaStat = { key: string; value: string };

export type EaProduct = {
  id: "goldmaster" | "scalp";
  name: string;
  version: string;
  accent: EaAccent;
  /** Neutral spec codes shown as a mono strip. */
  symbol: string;
  timeframe: string;
  /** "long" | "both" — resolved to a localized label in copy. */
  direction: "long" | "both";
  period: string;
  dataQuality: string;
  recommendedRisk: string;
  /** Four headline KPIs (value neutral; label from copy by index). */
  headline: { value: string; tone?: "good" | "bad" }[];
  finalBalance: string;
  riskMatrix: RiskRow[];
  /** extra column header key for the risk matrix (copy resolves it). */
  matrixExtraKey: "cagr" | "trades";
  tradeStats: EaStat[];
  /** Monthly equity progression (Scalp only). */
  monthly?: { month: string; gainPct: number }[];
};

export const GOLDMASTER: EaProduct = {
  id: "goldmaster",
  name: "Dralvo GoldMaster",
  version: "v1.08",
  accent: "gold",
  symbol: "XAUUSD",
  timeframe: "D1",
  direction: "long",
  period: "10Y",
  dataQuality: "98%",
  recommendedRisk: "5%",
  headline: [
    { value: "+1502%", tone: "good" },
    { value: "2.65" },
    { value: "43.3%" },
    { value: "23.8%", tone: "bad" },
  ],
  finalBalance: "$100K → $1.6M",
  matrixExtraKey: "cagr",
  riskMatrix: [
    { risk: "1%", ret: "+98%", ddEquity: "6.1%", pf: "2.43", extra: "~6.9%/y" },
    { risk: "2%", ret: "+263%", ddEquity: "11.2%", pf: "2.54", extra: "~13.3%/y" },
    { risk: "3%", ret: "+527%", ddEquity: "15.8%", pf: "2.61", extra: "~19.5%/y" },
    { risk: "5%", ret: "+1502%", ddEquity: "23.8%", pf: "2.65", extra: "~30.9%/y", star: true },
  ],
  tradeStats: [
    { key: "trades", value: "141" },
    { key: "winRate", value: "43.3%" },
    { key: "avgWin", value: "+$7,122" },
    { key: "avgLoss", value: "-$2,139" },
    { key: "rr", value: "3.33 : 1" },
    { key: "streak", value: "4 / 7" },
  ],
};

export const GOLD_SCALP: EaProduct = {
  id: "scalp",
  name: "Dralvo Gold Scalp",
  version: "v1.0",
  accent: "steel",
  symbol: "XAUUSD",
  timeframe: "M5",
  direction: "both",
  period: "6M",
  dataQuality: "100%",
  recommendedRisk: "2.5%",
  headline: [
    { value: "+239%", tone: "good" },
    { value: "1.56" },
    { value: "64%" },
    { value: "12.9%", tone: "bad" },
  ],
  finalBalance: "$100K → $339,200",
  matrixExtraKey: "trades",
  riskMatrix: [
    { risk: "1%", ret: "+68%", ddEquity: "8.9%", pf: "1.56", extra: "355" },
    { risk: "1.5%", ret: "+116%", ddEquity: "9.7%", pf: "1.56", extra: "334" },
    { risk: "2%", ret: "+158%", ddEquity: "11.0%", pf: "1.56", extra: "296" },
    { risk: "2.5%", ret: "+234%", ddEquity: "12.9%", pf: "1.56", extra: "308", star: true },
    { risk: "3%", ret: "+208%", ddEquity: "14.8%", pf: "1.56", extra: "254" },
  ],
  tradeStats: [
    { key: "trades", value: "308" },
    { key: "winRate", value: "63.96%" },
    { key: "avgWin", value: "+$3,373" },
    { key: "avgLoss", value: "-$3,831" },
    { key: "avgHold", value: "10m 31s" },
    { key: "streak", value: "13 / 4" },
  ],
  monthly: [
    { month: "01", gainPct: 23.5 },
    { month: "02", gainPct: 37.9 },
    { month: "03", gainPct: 9.5 },
    { month: "04", gainPct: 2.7 },
    { month: "05", gainPct: 10.8 },
    { month: "06", gainPct: 60.0 },
  ],
};

export const EA_PRODUCTS: EaProduct[] = [GOLDMASTER, GOLD_SCALP];

/* -------------------------------------------------------------------------- */
/*  Legacy — Dralvo_GoldEA 20y run. Still consumed by /api/signal/current and  */
/*  /track-record until those migrate to GOLDMASTER. NOT for marketing.        */
/* -------------------------------------------------------------------------- */
export const DRALVO_BACKTEST = {
  source: "MT5 Strategy Tester",
  asset: "XAUUSD",
  strategy: "Tier 3A - CFTC + Trend + Pullback (D1)",
  periodLabel: "20 years (2006-2025)",
  direction: "long-only",
  initialDeposit: 100_000,
  netProfit: 896_643.57,
  netProfitPct: 896.6,
  profitFactor: 1.97,
  winRate: 0.367,
  totalTrades: 196,
  wins: 72,
  losses: 124,
  avgWin: 25_272.83,
  avgLoss: 7_443.55,
  rewardRisk: 3.4,
  maxBalanceDrawdownPct: 15.16,
  maxEquityDrawdownPct: 24.78,
  maxConsecutiveLosses: 10,
  sharpeRatio: 10.14,
  recoveryFactor: 2.85,
} as const;

export const DRALVO_EXPECTATIONS = {
  winRatePct: 37,
  maxConsecutiveLosses: 10,
  maxDrawdownPct: 25,
  rewardRisk: 3.4,
  points: [
    "Win rate ~37% - you lose more often than you win. The edge is a ~3.4:1 reward-to-risk ratio.",
    "You can lose up to 10 trades in a row. Maximum historical drawdown ~25%.",
    "Long only: 0 trades when gold is bearish (CFTC bearish) = capital preserved, not a malfunction.",
    "Past backtest performance does not guarantee future results.",
  ],
} as const;
