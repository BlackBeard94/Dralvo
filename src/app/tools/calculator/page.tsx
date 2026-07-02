"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calculator,
  Gauge,
  ShieldCheck,
  Target,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { BrandLink } from "@/components/shared/brand";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useLocale } from "@/hooks/use-locale";
import { withLocaleFallback } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const SERIF = "'DM Serif Display', 'Playfair Display', 'Times New Roman', serif";

const RISK_COPY = withLocaleFallback({
  en: {
    navHome: "Home",
    badge: "Risk Manager",
    title: "Position Size & Risk Calculator",
    balance: "Balance",
    leverage: "Leverage",
    symbol: "Symbol",
    entry: "Entry price",
    stopLoss: "Stop loss",
    riskPct: "Risk %",
    lot: "lot",
    slDistance: "SL Distance",
    riskAmount: "Risk Amount",
    potentialLoss: "Potential Loss",
    rrRatio: "RR Ratio",
    rrTitle: "Risk-Reward Calculator",
    takeProfit: "Take profit",
    dashboard: "Risk Dashboard",
    accountBalance: "Account Balance",
    riskPerTrade: "Risk Per Trade",
    dailyLoss: "Daily Loss",
    dailyLimit: "Daily Limit",
    riskAssessment: "Risk Assessment",
    propFirm: "Prop Firm Rules",
    selectFirm: "Select firm",
    none: "None",
    dailyTracker: "Daily Loss Tracker",
    todayLoss: "Today\u2019s loss ($)",
    remaining: "remaining today.",
    limitExceeded: "\u26a0 Limit exceeded \u2014 stop trading.",
    limitWarning: "\u26a0 Approaching limit.",
    entrySLHint: "set above in Position Size.",
    breakEven: "Break-even win rate:",
    breakEvenText: "You need to win 1 out of every {n} trades to break even.",
    safe: "Safe",
    moderate: "Moderate",
    aggressive: "Aggressive",
    dangerous: "Dangerous",
    rrGood: "\u2713 Good",
    rrAcceptable: "\u2022 Acceptable",
    rrPoor: "\u26a0 Poor",
    riskHigh: "\u26a0 High",
    riskModerate: "\u2022 Moderate",
    riskLow: "\u2713 Low",
    lotLarge: "\u26a0 Large",
    lotModerate: "\u2022 Moderate",
    lotNormal: "\u2713 Normal",
    dailyLossProp: "Daily Loss",
    maxDD: "Max DD",
    profitTarget: "Profit Target",
  },
  vi: {
    navHome: "Trang ch\u1ee7",
    badge: "Qu\u1ea3n l\u00fd r\u1ee7i ro",
    title: "T\u00ednh lot & Qu\u1ea3n l\u00fd r\u1ee7i ro",
    balance: "S\u1ed1 d\u01b0",
    leverage: "\u0110\u00f2n b\u1ea9y",
    symbol: "M\u00e3",
    entry: "Gi\u00e1 v\u00e0o",
    stopLoss: "C\u1eaft l\u1ed7",
    riskPct: "R\u1ee7i ro %",
    lot: "lot",
    slDistance: "Kho\u1ea3ng c\u00e1ch SL",
    riskAmount: "Ti\u1ec1n r\u1ee7i ro",
    potentialLoss: "L\u1ed7 d\u1ef1 ki\u1ebfn",
    rrRatio: "T\u1ef7 l\u1ec7 RR",
    rrTitle: "T\u00ednh Risk-Reward",
    takeProfit: "Ch\u1ed1t l\u1eddi",
    dashboard: "B\u1ea3ng r\u1ee7i ro",
    accountBalance: "S\u1ed1 d\u01b0",
    riskPerTrade: "R\u1ee7i ro / l\u1ec7nh",
    dailyLoss: "L\u1ed7 h\u00f4m nay",
    dailyLimit: "Gi\u1edbi h\u1ea1n ng\u00e0y",
    riskAssessment: "\u0110\u00e1nh gi\u00e1 r\u1ee7i ro",
    propFirm: "Quy \u0111\u1ecbnh Prop Firm",
    selectFirm: "Ch\u1ecdn firm",
    none: "Kh\u00f4ng",
    dailyTracker: "Theo d\u00f5i l\u1ed7 ng\u00e0y",
    todayLoss: "L\u1ed7 h\u00f4m nay ($)",
    remaining: "c\u00f2n l\u1ea1i h\u00f4m nay.",
    limitExceeded: "\u26a0 V\u01b0\u1ee3t gi\u1edbi h\u1ea1n \u2014 d\u1eebng giao d\u1ecbch.",
    limitWarning: "\u26a0 G\u1ea7n gi\u1edbi h\u1ea1n.",
    entrySLHint: "\u0111\u00e3 \u0111\u1eb7t \u1edf tr\u00ean.",
    breakEven: "T\u1ef7 l\u1ec7 h\u00f2a v\u1ed1n:",
    breakEvenText: "B\u1ea1n c\u1ea7n th\u1eafng 1 trong m\u1ed7i {n} l\u1ec7nh \u0111\u1ec3 h\u00f2a v\u1ed1n.",
    safe: "An to\u00e0n",
    moderate: "V\u1eeba ph\u1ea3i",
    aggressive: "M\u1ea1o hi\u1ec3m",
    dangerous: "Nguy hi\u1ec3m",
    rrGood: "\u2713 T\u1ed1t",
    rrAcceptable: "\u2022 Ch\u1ea5p nh\u1eadn \u0111\u01b0\u1ee3c",
    rrPoor: "\u26a0 K\u00e9m",
    riskHigh: "\u26a0 Cao",
    riskModerate: "\u2022 V\u1eeba",
    riskLow: "\u2713 Th\u1ea5p",
    lotLarge: "\u26a0 L\u1edbn",
    lotModerate: "\u2022 V\u1eeba",
    lotNormal: "\u2713 B\u00ecnh th\u01b0\u1eddng",
    dailyLossProp: "L\u1ed7 ng\u00e0y",
    maxDD: "DD t\u1ed1i \u0111a",
    profitTarget: "M\u1ee5c ti\u00eau l\u1ee3i nhu\u1eadn",
  },
});

// ponytail: simplified pip/point values per lot
const PIP_VALUE: Record<string, number> = {
  xauusd: 1,
  xagusd: 50,
  eurusd: 10,
  gbpusd: 10,
  usdjpy: 9.5,
  audusd: 10,
  nzdusd: 10,
  usdcad: 7.5,
  usdchf: 10,
  usoil: 10,
};

const SYMBOLS = [
  { key: "xauusd", label: "XAU/USD", pointSize: 0.01 },
  { key: "xagusd", label: "XAG/USD", pointSize: 0.01 },
  { key: "eurusd", label: "EUR/USD", pointSize: 0.0001 },
  { key: "gbpusd", label: "GBP/USD", pointSize: 0.0001 },
  { key: "usdjpy", label: "USD/JPY", pointSize: 0.001 },
  { key: "audusd", label: "AUD/USD", pointSize: 0.0001 },
  { key: "nzdusd", label: "NZD/USD", pointSize: 0.0001 },
  { key: "usdcad", label: "USD/CAD", pointSize: 0.0001 },
  { key: "usdchf", label: "USD/CHF", pointSize: 0.0001 },
  { key: "usoil", label: "US Oil", pointSize: 0.01 },
];

const PROP_FIRMS = {
  ftmo: { dailyLoss: 5, maxDrawdown: 10, profitTarget: 10, name: "FTMO" },
  fundednext: { dailyLoss: 5, maxDrawdown: 10, profitTarget: 8, name: "FundedNext" },
  fundingpips: { dailyLoss: 4, maxDrawdown: 10, profitTarget: 8, name: "FundingPips" },
  the5ers: { dailyLoss: 3, maxDrawdown: 6, profitTarget: 8, name: "The5ers" },
};

function formatMoney(v: number) {
  if (!Number.isFinite(v)) return "-";
  return "$" + v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function ResultCard({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" | "warn" }) {
  return (
    <div className="rounded-lg border border-border bg-surface/75 p-4">
      <p className="text-[11px] uppercase tracking-[0.12em] text-text-muted">{label}</p>
      <p className={cn("mt-2 font-mono text-xl font-semibold", tone === "good" && "text-green", tone === "bad" && "text-red", tone === "warn" && "text-gold", !tone && "text-text-primary")}>
        {value}
      </p>
    </div>
  );
}

export default function RiskManagerPage() {
  const { locale } = useLocale();
  const copy = RISK_COPY[locale];

  const [balance, setBalance] = useState(10000);
  const [leverage, setLeverage] = useState(2000);
  const [symbol, setSymbol] = useState("xauusd");
  const [entry, setEntry] = useState(3350);
  const [stopLoss, setStopLoss] = useState(3340);
  const [riskPct, setRiskPct] = useState(1);
  const [takeProfit, setTakeProfit] = useState(3380);
  const [propFirm, setPropFirm] = useState("");
  const [dailyLoss] = useState(0);

  const selectedSymbol = SYMBOLS.find((s) => s.key === symbol) ?? SYMBOLS[0];
  const pointSize = selectedSymbol.pointSize;
  const pipValue = PIP_VALUE[symbol] ?? 10;

  const slPoints = Math.abs(entry - stopLoss) / pointSize;
  const tpPoints = Math.abs(takeProfit - entry) / pointSize;
  const riskAmount = balance * (riskPct / 100);
  const lotSize = slPoints > 0 ? riskAmount / (slPoints * pipValue) : 0;
  const rrRatio = tpPoints > 0 && slPoints > 0 ? tpPoints / slPoints : 0;
  const estimatedProfit = lotSize * tpPoints * pipValue;
  const breakEvenRate = rrRatio > 0 ? (1 / (rrRatio + 1)) * 100 : 0;

  const firmRules = propFirm ? PROP_FIRMS[propFirm as keyof typeof PROP_FIRMS] : null;
  const dailyLossLimit = firmRules ? balance * (firmRules.dailyLoss / 100) : balance * 0.05;
  const maxDrawdownLimit = firmRules ? balance * (firmRules.maxDrawdown / 100) : balance * 0.10;
  const profitTarget = firmRules ? balance * (firmRules.profitTarget / 100) : 0;

  const riskScore = Math.min(100, Math.max(0, Math.round(
    100 - (riskPct * 15) - (lotSize > 2 ? 20 : 0) - (dailyLoss / balance * 200) - (rrRatio < 1 ? 15 : 0)
  )));
  const riskLevel = riskScore >= 70 ? copy.safe : riskScore >= 40 ? copy.moderate : riskScore >= 20 ? copy.aggressive : copy.dangerous;
  const riskTone = riskLevel === copy.safe ? "good" : riskLevel === copy.moderate ? "warn" : "bad";

  return (
    <div className="min-h-screen overflow-x-hidden bg-deep text-text-primary antialiased">
      <nav className="sticky top-0 z-50 border-b border-border bg-deep/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-2 px-4 sm:px-6">
          <BrandLink
            className="min-w-0 gap-2 sm:gap-4"
            logoClassName="h-10 w-10 sm:h-[72px] sm:w-[72px]"
            wordmarkClassName="text-base sm:text-2xl transition-colors group-hover:text-text-primary"
          />
          <div className="flex items-center gap-2">
            <Link href="/" className="inline-flex h-10 items-center gap-1.5 rounded-md border border-border px-2.5 text-[13px] text-text-muted no-underline transition-colors hover:border-gold/40 hover:text-gold sm:px-3">
              <ArrowLeft size={14} /><span className="hidden sm:inline">{copy.navHome}</span>
            </Link>
            <ThemeToggle className="h-10 w-10" />
            <LanguageSwitcher className="h-10" />
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-[1280px] space-y-5 px-4 py-5 sm:px-6" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <section className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/8 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-gold">
              <ShieldCheck className="h-3 w-3" />
              {copy.badge}
            </span>
            <h1 className="mt-3 text-3xl font-normal text-text-primary" style={{ fontFamily: SERIF }}>
              {copy.title}
            </h1>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-surface/85 px-4 py-3">
            <Wallet className="h-4 w-4 text-gold" />
            <label className="grid gap-0.5 text-xs text-text-muted">
              {copy.balance}
              <input type="number" onFocus={(e) => e.target.select()} value={balance} min={100} max={10000000} step={100}
                onChange={(e) => setBalance(Number(e.target.value))}
                className="h-9 w-32 rounded-md border border-border bg-surface px-2 text-sm text-text-primary outline-none focus:border-gold/60" />
            </label>
            <label className="grid gap-0.5 text-xs text-text-muted">
              {copy.leverage}
              <select value={leverage} onChange={(e) => setLeverage(Number(e.target.value))}
                className="h-9 rounded-md border border-border bg-surface px-2 text-sm text-text-primary outline-none focus:border-gold/60">
                {[100, 200, 500, 1000, 2000].map((l) => <option key={l} value={l}>1:{l}</option>)}
              </select>
            </label>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
          <div className="space-y-5">
            <section className="rounded-lg border border-border bg-surface/85 p-5 lg:p-6">
              <div className="flex items-center gap-2 mb-5">
                <Calculator className="h-4 w-4 text-gold" />
                <h2 className="text-lg font-semibold text-text-primary">{copy.title}</h2>
              </div>
              {/* ponytail: compact single-row layout — no column overlap */}
              <div className="flex flex-wrap items-end gap-3">
                <label className="grid gap-1 text-xs text-text-muted">
                  {copy.symbol}
                  <select value={symbol} onChange={(e) => setSymbol(e.target.value)}
                    className="h-10 w-24 rounded-md border border-border bg-surface px-2 text-sm text-text-primary outline-none focus:border-gold/60">
                    {SYMBOLS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </label>
                <label className="grid gap-1 text-xs text-text-muted">
                  {copy.entry}
                  <input type="number" onFocus={(e) => e.target.select()} value={entry} step={pointSize} min={0}
                    onChange={(e) => setEntry(Number(e.target.value))}
                    className="h-10 w-28 rounded-md border border-border bg-surface px-2 text-sm text-text-primary outline-none focus:border-gold/60" />
                </label>
                <label className="grid gap-1 text-xs text-text-muted">
                  {copy.stopLoss}
                  <input type="number" onFocus={(e) => e.target.select()} value={stopLoss} step={pointSize} min={0}
                    onChange={(e) => setStopLoss(Number(e.target.value))}
                    className="h-10 w-28 rounded-md border border-border bg-surface px-2 text-sm text-text-primary outline-none focus:border-gold/60" />
                </label>
                <label className="grid gap-1 text-xs text-text-muted">
                  {copy.riskPct}
                  <input type="number" onFocus={(e) => e.target.select()} value={riskPct} min={0.1} max={100} step={0.1}
                    onChange={(e) => setRiskPct(Number(e.target.value))}
                    className="h-10 w-20 rounded-md border border-border bg-surface px-2 text-sm text-text-primary outline-none focus:border-gold/60" />
                </label>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-4">
                <ResultCard label={copy.riskAmount} value={formatMoney(riskAmount)} tone="bad" />
                <ResultCard label="Est. Profit" value={formatMoney(estimatedProfit)} tone="good" />
                <ResultCard label="Lot" value={lotSize > 0 ? lotSize.toFixed(2) : "-"} />
                <ResultCard label={copy.rrRatio} value={rrRatio > 0 ? `1:${rrRatio.toFixed(1)}` : "-"} tone={rrRatio >= 2 ? "good" : "warn"} />
              </div>
            </section>

            <section className="rounded-lg border border-border bg-surface/85 p-5 lg:p-6">
              <div className="flex items-center gap-2 mb-5">
                <Target className="h-4 w-4 text-gold" />
                <h2 className="text-lg font-semibold text-text-primary">{copy.rrTitle}</h2>
              </div>
              <p className="text-xs text-text-muted mb-4">
                {copy.entry}: <span className="font-mono text-text-primary">{entry}</span> &middot; {copy.stopLoss}: <span className="font-mono text-text-primary">{stopLoss}</span> &mdash; {copy.entrySLHint}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-xs text-text-muted">
                  {copy.takeProfit}
                  <input type="number" onFocus={(e) => e.target.select()} value={takeProfit} step={pointSize} min={0}
                    onChange={(e) => setTakeProfit(Number(e.target.value))}
                    className="h-10 rounded-md border border-border bg-surface px-2 text-sm text-text-primary outline-none focus:border-gold/60" />
                </label>
                <div className="grid gap-1 text-xs text-text-muted">
                  <span className="opacity-0">.</span>
                  <div className="h-10 rounded-md border border-green/30 bg-green/5 flex items-center justify-center font-mono text-lg font-semibold text-green">
                    {rrRatio > 0 ? `1:${rrRatio.toFixed(1)}` : "-"}
                  </div>
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <ResultCard label={copy.slDistance} value={`${slPoints > 0 ? slPoints.toFixed(0) : "-"} pt`} />
                <ResultCard label="TP Distance" value={`${tpPoints > 0 ? tpPoints.toFixed(0) : "-"} pt`} />
                <ResultCard label={copy.rrRatio} value={rrRatio > 0 ? `1:${rrRatio.toFixed(1)}` : "-"} tone={rrRatio >= 2 ? "good" : "warn"} />
              </div>
              <div className="mt-4 rounded-md border border-border bg-deep/35 p-3 text-sm text-text-secondary">
                {copy.breakEven} <span className="font-mono text-text-primary">{rrRatio > 0 ? breakEvenRate.toFixed(1) + "%" : "-"}</span>
                {" — "}{rrRatio > 0 ? copy.breakEvenText.replace("{n}", (rrRatio + 1).toFixed(0)) : "-"}
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-lg border border-border bg-surface/85 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Gauge className="h-4 w-4 text-gold" />
                <h2 className="text-sm font-semibold text-text-primary">{copy.dashboard}</h2>
              </div>
              <ResultCard label={copy.accountBalance} value={formatMoney(balance)} />
              <div className="mt-3 grid grid-cols-1  grid-cols-2 gap-3">
                <ResultCard label={copy.riskPerTrade} value={`${riskPct}%`} tone={riskPct > 2 ? "bad" : undefined} />
                <ResultCard label={copy.riskAmount} value={formatMoney(riskAmount)} />
                <ResultCard label={copy.dailyLoss} value={formatMoney(dailyLoss)} tone={dailyLoss > dailyLossLimit ? "bad" : undefined} />
                <ResultCard label={copy.dailyLimit} value={formatMoney(dailyLossLimit)} />
              </div>
            </section>

            <section className="rounded-lg border border-border bg-surface/85 p-5">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="h-4 w-4 text-gold" />
                <h2 className="text-sm font-semibold text-text-primary">{copy.riskAssessment}</h2>
              </div>
              <div className="rounded-lg border border-border bg-surface/75 p-4 text-center">
                <p className={cn("text-2xl font-bold", riskTone === "good" ? "text-green" : riskTone === "bad" ? "text-red" : "text-gold")}>
                  {riskScore}/100
                </p>
                <p className={cn("mt-1 text-sm font-semibold", riskTone === "good" ? "text-green" : riskTone === "bad" ? "text-red" : "text-gold")}>
                  {riskLevel}
                </p>
                <div className="mt-3 space-y-1 text-xs text-text-muted">
                  <p>{copy.riskPct}: {riskPct > 2 ? copy.riskHigh : riskPct > 1 ? copy.riskModerate : copy.riskLow}</p>
                  <p>Lot size: {lotSize > 2 ? copy.lotLarge : lotSize > 1 ? copy.lotModerate : lotSize > 0 ? copy.lotNormal : "-"}</p>
                  <p>RR: {rrRatio >= 2 ? copy.rrGood : rrRatio >= 1 ? copy.rrAcceptable : rrRatio > 0 ? copy.rrPoor : "-"}</p>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-border bg-surface/85 p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="h-4 w-4 text-gold" />
                <h2 className="text-sm font-semibold text-text-primary">{copy.propFirm}</h2>
              </div>
              <label className="grid gap-1 text-xs text-text-muted mb-4">
                {copy.selectFirm}
                <select value={propFirm} onChange={(e) => setPropFirm(e.target.value)}
                  className="h-10 rounded-md border border-border bg-surface px-2 text-sm text-text-primary outline-none focus:border-gold/60">
                  <option value="">{copy.none}</option>
                  {Object.entries(PROP_FIRMS).map(([key, f]) => <option key={key} value={key}>{f.name}</option>)}
                </select>
              </label>
              {firmRules && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">{copy.dailyLossProp}</span>
                    <span className={cn("font-mono", dailyLoss > dailyLossLimit ? "text-red" : "text-text-primary")}>
                      {formatMoney(dailyLoss)} / {formatMoney(dailyLossLimit)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">{copy.maxDD}</span>
                    <span className="font-mono text-text-primary">{formatMoney(maxDrawdownLimit)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">{copy.profitTarget}</span>
                    <span className="font-mono text-gold">{formatMoney(profitTarget)}</span>
                  </div>
                  <div className="mt-2 rounded-md border border-gold/20 bg-gold/5 p-2 text-xs text-text-muted">
                    {firmRules.name}: {firmRules.dailyLoss}% {copy.dailyLossProp.toLowerCase()} &bull; {firmRules.maxDrawdown}% {copy.maxDD.toLowerCase()}
                  </div>
                </div>
              )}
            </section>

            
          </aside>
        </div>
      </main>
    </div>
  );
}
