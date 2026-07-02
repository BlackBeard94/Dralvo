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

export type EaAccent = "gold" | "steel" | "emerald";

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
  id: "goldmaster" | "scalp" | "tigold";
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

/* GoldMaster — Source: MT5 Strategy Tester · XAUUSDm (Exness) · D1 · 1-min OHLC
   · 07/2018–06/2026 (~8 years) · 1:500 · 10K basis, no fixed TP (ATR trailing). */
export const GOLDMASTER: EaProduct = {
  id: "goldmaster",
  name: "Dralvo GoldMaster",
  version: "v1.08",
  accent: "gold",
  symbol: "XAUUSD",
  timeframe: "D1",
  direction: "long",
  period: "8Y",
  dataQuality: "OHLC",
  recommendedRisk: "5%",
  headline: [
    { value: "+792%", tone: "good" },
    { value: "2.40" },
    { value: "39.4%" },
    { value: "23.6%", tone: "bad" },
  ],
  finalBalance: "$10K → $89,203",
  matrixExtraKey: "cagr",
  riskMatrix: [
    { risk: "1%", ret: "+77%", ddEquity: "6.2%", pf: "2.58", extra: "~7.4%/y" },
    { risk: "2%", ret: "+181%", ddEquity: "10.8%", pf: "2.50", extra: "~13.8%/y" },
    { risk: "3%", ret: "+327%", ddEquity: "15.3%", pf: "2.48", extra: "~19.9%/y" },
    { risk: "5%", ret: "+792%", ddEquity: "23.6%", pf: "2.40", extra: "~31.5%/y", star: true },
  ],
  tradeStats: [
    { key: "trades", value: "94" },
    { key: "winRate", value: "39.4%" },
    { key: "avgWin", value: "~+$3,670" },
    { key: "avgLoss", value: "~-$992" },
    { key: "rr", value: "~3.7 : 1" },
  ],
};

/* GoldScalp — Source: MT5 Strategy Tester · XAUUSD M15 · real ticks (GTC, 98% quality)
   · 09/2023–06/2026 (~33M) · 10K · re-optimized (genetic + real-tick verify).
   Profitable every year incl. 2024–2025 sideways. PF ~1.9. % risk → balance-agnostic. */
export const GOLD_SCALP: EaProduct = {
  id: "scalp",
  name: "Dralvo GoldScalp",
  version: "v2.0",
  accent: "steel",
  symbol: "XAUUSD",
  timeframe: "M15",
  direction: "both",
  period: "33M",
  dataQuality: "98%",
  recommendedRisk: "2.0%",
  headline: [
    { value: "+139%", tone: "good" },
    { value: "1.89" },
    { value: "~40%" },
    { value: "18.8%", tone: "bad" },
  ],
  finalBalance: "$10K → $23,899",
  matrixExtraKey: "trades",
  riskMatrix: [
    { risk: "1.0%", ret: "+57%", ddEquity: "9.7%", pf: "1.90", extra: "110" },
    { risk: "1.5%", ret: "+96%", ddEquity: "14.3%", pf: "1.91", extra: "110" },
    { risk: "2.0%", ret: "+139%", ddEquity: "18.8%", pf: "1.89", extra: "111", star: true },
    { risk: "2.5%", ret: "+158%", ddEquity: "28.6%", pf: "1.80", extra: "109" },
  ],
  tradeStats: [
    { key: "trades", value: "110" },
    { key: "winRate", value: "~40%" },
  ],
  monthly: [
    { month: "2023", gainPct: 19.7 },
    { month: "2024", gainPct: 11.6 },
    { month: "2025", gainPct: 15.7 },
    { month: "2026", gainPct: 9.9 },
  ],
};

/* -------------------------------------------------------------------------- */
/*  TiGold — momentum scalping engine for XAUUSD (free with Dralvo IB)         */
/*  Source: GTC MT5 Strategy Tester · XAUUSD M1 · 01/2026–06/2026 · real ticks  */
/*  Sample capital 10K, monthly-reset model (max DD ≤ 30%). Recommended config */
/*  (DailyTarget 6%, fixed lot 0.08). 6 months green, return scale-invariant.  */
/* -------------------------------------------------------------------------- */
export const TIGOLD: EaProduct = {
  id: "tigold",
  name: "Dralvo TiGold",
  version: "v3.0",
  accent: "emerald",
  symbol: "XAUUSD",
  timeframe: "M1",
  direction: "both",
  period: "6M",
  dataQuality: "100%",
  recommendedRisk: "0.08 lot",
  headline: [
    { value: "+97.7%", tone: "good" },
    { value: "1.18" },
    { value: "76%" },
    { value: "28.1%", tone: "bad" },
  ],
  finalBalance: "$10K → +$9,768 / 6mo",
  matrixExtraKey: "trades",
  riskMatrix: [
    { risk: "Conservative", ret: "+81.5%", ddEquity: "26.0%", pf: "~1.1", extra: "—" },
    { risk: "Recommended", ret: "+97.7%", ddEquity: "28.1%", pf: "1.18", extra: "1,105", star: true },
    { risk: "Aggressive", ret: "+105.8%", ddEquity: "32.1%", pf: "~1.2", extra: "—" },
  ],
  tradeStats: [
    { key: "trades", value: "1,105" },
    { key: "winRate", value: "~76%" },
    { key: "avgWin", value: "~+$76" },
    { key: "avgLoss", value: "-$205" },
    { key: "rr", value: "~0.37 : 1" },
  ],
  monthly: [
    { month: "T1", gainPct: 32.2 },
    { month: "T2", gainPct: 14.5 },
    { month: "T3", gainPct: 8.6 },
    { month: "T4", gainPct: 7.1 },
    { month: "T5", gainPct: 13.5 },
    { month: "T6", gainPct: 21.9 },
  ],
};

export const EA_PRODUCTS: EaProduct[] = [TIGOLD, GOLDMASTER, GOLD_SCALP];

/* Legacy DRALVO_BACKTEST / DRALVO_EXPECTATIONS (Dralvo_GoldEA 20y run) removed —
   backtest is no longer maintained. The EA signal API (/api/signal/current) keeps
   serving the live signal + CFTC; marketing uses GOLDMASTER above. */
