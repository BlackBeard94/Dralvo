import type { Metadata } from "next";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock3,
  DatabaseZap,
  Gauge,
  History,
  LineChart,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dralvo Dashboard Redesign Preview",
  description: "Static HTML preview for the redesigned Dralvo dashboard UI.",
  robots: { index: false, follow: false },
};

const drivers = [
  {
    label: "XAUUSD price context",
    state: "Supportive",
    tone: "support",
    detail: "Daily change +2.01%, price remains above the short-term range.",
  },
  {
    label: "TIPS 10Y real yield",
    state: "Supportive",
    tone: "support",
    detail: "Real yield down -5 bps. Lower yield pressure supports gold.",
  },
  {
    label: "CFTC managed money",
    state: "Bearish",
    tone: "risk",
    detail: "Net long position reduced by 6,316 contracts from prior report.",
  },
  {
    label: "COMEX registered stock",
    state: "Stale",
    tone: "stale",
    detail: "Latest configured source passed the freshness threshold.",
  },
] as const;

const evidence = [
  ["Verified drivers", "2 / 4", "Only confirmed inputs affect the thesis."],
  ["Missing", "0", "No required source is absent."],
  ["Stale", "2", "COMEX and GLD need a fresh observation."],
  ["Bias", "Neutral", "Mixed signal, no directional edge yet."],
];

const timeline = [
  {
    date: "15/6/2026",
    title: "Thesis shifted from mixed to neutral",
    body: "XAUUSD and TIPS stayed supportive, but positioning and stale inventory blocked conviction.",
    tag: "No trade",
  },
  {
    date: "14/6/2026",
    title: "State unchanged",
    body: "Driver balance remained mixed. No new validated catalyst.",
    tag: "Watch",
  },
  {
    date: "13/6/2026",
    title: "First thesis snapshot",
    body: "Baseline generated from available verified evidence.",
    tag: "Baseline",
  },
];

const timeframes = [
  {
    label: "1H",
    role: "Execution",
    readiness: "Not ready",
    score: "42%",
    detail: "Needs ATR, structure, session behavior, and live 1H candles.",
  },
  {
    label: "4H",
    role: "Primary setup",
    readiness: "Partial",
    score: "61%",
    detail: "Has price context and momentum, but lacks robust support/resistance.",
  },
  {
    label: "Daily",
    role: "Directional bias",
    readiness: "Usable",
    score: "74%",
    detail: "Macro and positioning drivers can support a cautious bias.",
  },
  {
    label: "Weekly",
    role: "Macro regime",
    readiness: "Usable",
    score: "70%",
    detail: "CFTC, real yields, ETF holdings, and inventory fit this horizon best.",
  },
] as const;

const signalHistory = [
  {
    id: "DRX-240615-4H-003",
    timeframe: "4H",
    direction: "Stand aside",
    entry: "-",
    tp: "-",
    sl: "-",
    status: "No trade",
    result: "Filtered",
    reason: "Insufficient agreement between macro and positioning.",
  },
  {
    id: "DRX-240614-D-002",
    timeframe: "Daily",
    direction: "Buy watch",
    entry: "4328-4336",
    tp: "4372 / 4398",
    sl: "4304",
    status: "Closed",
    result: "+1.6R",
    reason: "Real yield drop confirmed by price strength.",
  },
  {
    id: "DRX-240612-1H-001",
    timeframe: "1H",
    direction: "Sell scalp",
    entry: "4294-4297",
    tp: "4282 / 4275",
    sl: "4305",
    status: "Closed",
    result: "-1.0R",
    reason: "Momentum failed after New York open.",
  },
] as const;

const missingDrivers = [
  ["ATR / volatility", "Required", "Derive SL/TP from current volatility instead of fixed percent."],
  ["Market structure", "Required", "Swing high/low, break of structure, higher-low/lower-high logic."],
  ["Support / resistance", "Required", "Previous day/week high-low, session open, liquidity zones."],
  ["Session context", "High value", "Asia, London, New York, and overlap behavior for XAUUSD."],
  ["DXY + US yields", "High value", "Confirm USD pressure using DXY, US2Y, US10Y, real yields."],
  ["Economic calendar", "High value", "CPI, FOMC, NFP, Core PCE, Fed speakers: trade/no-trade filter."],
] as const;

function RailItem({
  icon: Icon,
  label,
  active = false,
}: {
  icon: typeof Activity;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition",
        active
          ? "bg-gold/12 text-gold ring-1 ring-gold/25"
          : "text-text-muted hover:bg-card hover:text-text-secondary",
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-2xl border border-border bg-card/70 p-4">
      <p className="text-[12px] uppercase tracking-[0.16em] text-text-muted">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl text-text-primary">{value}</p>
      <p className="mt-2 text-xs leading-5 text-text-muted">{detail}</p>
    </article>
  );
}

function DriverPill({
  driver,
}: {
  driver: (typeof drivers)[number];
}) {
  const isSupport = driver.tone === "support";
  const isRisk = driver.tone === "risk";

  return (
    <article className="rounded-2xl border border-border bg-surface/70 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-text-primary">
            {driver.label}
          </p>
          <p className="mt-2 text-xs leading-5 text-text-muted">
            {driver.detail}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 text-[12px] uppercase tracking-wider",
            isSupport && "border-green/30 bg-green/10 text-green",
            isRisk && "border-red/30 bg-red/10 text-red",
            !isSupport && !isRisk && "border-gold/30 bg-gold/10 text-gold",
          )}
        >
          {driver.state}
        </span>
      </div>
    </article>
  );
}

function TimeframeSelector() {
  return (
    <section className="rounded-3xl border border-border bg-surface/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[12px] uppercase tracking-[0.18em] text-gold">
            Analysis timeframe
          </p>
          <h2 className="mt-1 font-display text-2xl text-text-primary">
            Choose how Dralvo should think
          </h2>
        </div>
        <div className="grid grid-cols-4 gap-2 rounded-2xl border border-border bg-deep/60 p-1">
          {timeframes.map((timeframe) => (
            <button
              key={timeframe.label}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-semibold transition",
                timeframe.label === "4H"
                  ? "bg-gold text-[#060609]"
                  : "text-text-muted hover:bg-card hover:text-text-primary",
              )}
            >
              {timeframe.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-4">
        {timeframes.map((timeframe) => (
          <article
            key={timeframe.label}
            className={cn(
              "rounded-2xl border p-4",
              timeframe.label === "4H"
                ? "border-gold/35 bg-gold/10"
                : "border-border bg-card/70",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-display text-2xl text-text-primary">
                  {timeframe.label}
                </p>
                <p className="text-xs text-text-muted">{timeframe.role}</p>
              </div>
              <span
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[12px]",
                  timeframe.readiness === "Usable" &&
                    "border-green/30 bg-green/10 text-green",
                  timeframe.readiness === "Partial" &&
                    "border-gold/30 bg-gold/10 text-gold",
                  timeframe.readiness === "Not ready" &&
                    "border-red/30 bg-red/10 text-red",
                )}
              >
                {timeframe.score}
              </span>
            </div>
            <p className="mt-3 text-xs leading-5 text-text-muted">
              {timeframe.detail}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function SignalLifecycle() {
  return (
    <article className="rounded-3xl border border-border bg-surface/70 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[12px] uppercase tracking-[0.18em] text-gold">
            Signal lifecycle
          </p>
          <h2 className="mt-2 font-display text-2xl text-text-primary">
            Track every signal until TP, SL, expiry, or invalidation
          </h2>
        </div>
        <span className="rounded-full border border-green/30 bg-green/10 px-3 py-1 text-sm text-green">
          Transparent history
        </span>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-5">
        {[
          ["Generated", "Rule engine + AI brief"],
          ["Watching", "Price has not entered zone"],
          ["Active", "Entry touched"],
          ["Resolved", "TP/SL/expired"],
          ["Audited", "Result saved"],
        ].map(([title, detail], index) => (
          <div key={title} className="relative rounded-2xl border border-border bg-card/70 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-sm text-gold">
              {index + 1}
            </div>
            <p className="mt-3 text-sm font-semibold text-text-primary">
              {title}
            </p>
            <p className="mt-2 text-xs leading-5 text-text-muted">{detail}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function SignalHistoryTable() {
  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-surface/70">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-4">
        <div>
          <p className="text-[12px] uppercase tracking-[0.18em] text-gold">
            Public signal ledger
          </p>
          <h2 className="mt-1 font-display text-2xl text-text-primary">
            No cherry-picking: wins, losses, and filtered signals stay visible
          </h2>
        </div>
        <span className="rounded-full border border-border px-3 py-1 text-sm text-text-muted">
          Last 30 signals
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="border-b border-border text-[12px] uppercase tracking-[0.14em] text-text-muted">
            <tr>
              {["Signal", "TF", "Direction", "Entry", "TP", "SL", "Status", "Result", "Reason"].map((header) => (
                <th key={header} className="px-4 py-3 font-medium">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {signalHistory.map((signal) => (
              <tr key={signal.id} className="border-b border-border/60">
                <td className="px-4 py-4 font-mono text-xs text-text-muted">
                  {signal.id}
                </td>
                <td className="px-4 py-4 text-gold">{signal.timeframe}</td>
                <td className="px-4 py-4 text-text-primary">{signal.direction}</td>
                <td className="px-4 py-4 text-text-secondary">{signal.entry}</td>
                <td className="px-4 py-4 text-green">{signal.tp}</td>
                <td className="px-4 py-4 text-red">{signal.sl}</td>
                <td className="px-4 py-4 text-text-secondary">{signal.status}</td>
                <td
                  className={cn(
                    "px-4 py-4 font-semibold",
                    signal.result.startsWith("+") && "text-green",
                    signal.result.startsWith("-") && "text-red",
                    signal.result === "Filtered" && "text-gold",
                  )}
                >
                  {signal.result}
                </td>
                <td className="px-4 py-4 text-xs leading-5 text-text-muted">
                  {signal.reason}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function MissingDriversPanel() {
  return (
    <section className="rounded-3xl border border-border bg-surface/70 p-5">
      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-[12px] uppercase tracking-[0.18em] text-gold">
            Product value gap
          </p>
          <h2 className="mt-2 font-display text-3xl text-text-primary">
            Current data is useful for bias, not enough for high-quality execution
          </h2>
          <p className="mt-4 text-sm leading-7 text-text-muted">
            Dralvo can already explain macro context. To become valuable for
            traders, the next layer must turn that context into timeframe-aware
            setups, risk, and a transparent performance record.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {missingDrivers.map(([title, priority, detail]) => (
            <article key={title} className="rounded-2xl border border-border bg-card/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-text-primary">{title}</p>
                <span className="rounded-full border border-gold/25 px-2.5 py-1 text-[12px] text-gold">
                  {priority}
                </span>
              </div>
              <p className="mt-3 text-xs leading-5 text-text-muted">{detail}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ChartPreview() {
  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-surface/70">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-4">
        <div>
          <p className="text-[12px] uppercase tracking-[0.18em] text-text-muted">
            XAUUSD · Twelve Data · 4H
          </p>
          <div className="mt-2 flex items-end gap-3">
            <p className="font-display text-3xl text-text-primary">$4,357.17</p>
            <p className="pb-1 text-sm text-green">+5.74%</p>
          </div>
        </div>
        <div className="flex gap-2">
          {["4H", "1D", "1W"].map((item) => (
            <span
              key={item}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs",
                item === "4H"
                  ? "border-gold/40 bg-gold/10 text-gold"
                  : "border-border text-text-muted",
              )}
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="relative h-[320px] p-5">
        <div className="absolute inset-x-5 top-8 h-px bg-border/70" />
        <div className="absolute inset-x-5 top-24 h-px bg-border/50" />
        <div className="absolute inset-x-5 top-40 h-px bg-border/50" />
        <div className="absolute inset-x-5 top-56 h-px bg-border/50" />
        <svg
          viewBox="0 0 900 260"
          className="relative h-full w-full overflow-visible"
          role="img"
          aria-label="Mock XAUUSD chart"
        >
          <defs>
            <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(59,168,126,0.35)" />
              <stop offset="100%" stopColor="rgba(59,168,126,0)" />
            </linearGradient>
          </defs>
          <path
            d="M0 205 C85 190 105 138 170 150 C245 166 265 100 340 112 C420 124 440 72 520 88 C590 102 620 48 690 58 C760 66 800 34 900 42 L900 260 L0 260 Z"
            fill="url(#chartFill)"
          />
          <path
            d="M0 205 C85 190 105 138 170 150 C245 166 265 100 340 112 C420 124 440 72 520 88 C590 102 620 48 690 58 C760 66 800 34 900 42"
            fill="none"
            stroke="#3BA87E"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <line
            x1="610"
            x2="610"
            y1="28"
            y2="226"
            stroke="rgba(212,168,67,0.35)"
            strokeDasharray="8 8"
          />
          <rect
            x="630"
            y="40"
            width="170"
            height="52"
            rx="14"
            fill="rgba(17,17,28,0.88)"
            stroke="rgba(212,168,67,0.25)"
          />
          <text x="648" y="63" fill="#D4A843" fontSize="14">
            Watch zone
          </text>
          <text x="648" y="82" fill="#9A958A" fontSize="13">
            Need fresh inventory data
          </text>
        </svg>
      </div>
    </section>
  );
}

export default function DashboardRedesignPreviewPage() {
  return (
    <main className="min-h-screen bg-deep text-text-primary">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,168,67,0.12),transparent_34%),radial-gradient(circle_at_84%_18%,rgba(59,168,126,0.08),transparent_28%)]" />

      <div className="relative grid min-h-screen grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden border-r border-border bg-surface/70 p-5 backdrop-blur-xl lg:block">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
              D
            </div>
            <div>
              <p className="font-display text-xl text-text-primary">Dralvo</p>
              <p className="text-[12px] uppercase tracking-[0.16em] text-text-muted">
                Decision terminal
              </p>
            </div>
          </div>

          <nav className="mt-8 grid gap-2">
            <RailItem icon={Gauge} label="Today" active />
            <RailItem icon={DatabaseZap} label="Drivers" />
            <RailItem icon={Bell} label="Alerts" />
            <RailItem icon={History} label="Replay" />
          </nav>

          <div className="mt-8 rounded-2xl border border-border bg-card/70 p-4">
            <p className="text-[12px] uppercase tracking-[0.16em] text-gold">
              System health
            </p>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Sources</span>
                <span className="text-green">Verified</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">AI provider</span>
                <span className="text-gold">Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Plan</span>
                <span className="text-text-primary">Pro</span>
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-deep/75 px-5 py-4 backdrop-blur-xl lg:px-8">
            <div>
              <p className="text-[12px] uppercase tracking-[0.2em] text-gold">
                Today
              </p>
              <h1 className="mt-1 font-display text-2xl text-text-primary">
                Gold decision intelligence
              </h1>
            </div>
            <div className="hidden items-center gap-4 text-sm text-text-muted md:flex">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green" />
                Live · 15:08 UTC
              </span>
              <span className="rounded-full border border-border px-3 py-1">
                VI
              </span>
            </div>
          </header>

          <div className="mx-auto max-w-[1680px] space-y-6 p-5 lg:p-8">
            <TimeframeSelector />

            <section className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
              <article className="relative overflow-hidden rounded-[28px] border border-gold/25 bg-gradient-to-br from-surface via-card to-surface p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] lg:p-7">
                <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-gold/10 blur-3xl" />

                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1.5 text-[12px] uppercase tracking-[0.14em] text-gold">
                        <Sparkles className="h-3.5 w-3.5" />
                        AI signal
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-deep/50 px-3 py-1.5 text-[12px] uppercase tracking-[0.14em] text-text-muted">
                        <ShieldCheck className="h-3.5 w-3.5 text-green" />
                        Evidence locked
                      </span>
                    </div>

                    <div className="mt-6 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
                      <div>
                        <p className="text-[12px] uppercase tracking-[0.18em] text-text-muted">
                          Current stance
                        </p>
                        <p className="mt-2 font-display text-5xl leading-none text-text-primary">
                          Stand aside
                        </p>
                        <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-red/25 bg-red/10 px-3 py-1 text-sm text-red">
                          <AlertTriangle className="h-4 w-4" />
                          Low conviction
                        </p>
                      </div>

                      <div className="rounded-2xl border border-border bg-deep/45 p-5">
                        <p className="text-xl leading-8 text-text-primary">
                          Current evidence is useful for market bias, but not
                          yet strong enough for a live directional trade. The
                          4H setup needs volatility, structure, and session
                          confirmation before Dralvo can publish an actionable
                          signal.
                        </p>
                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                          <div className="rounded-xl border border-border bg-card/70 p-3">
                            <p className="text-[12px] uppercase tracking-wider text-text-muted">
                              Reference
                            </p>
                            <p className="mt-1 font-display text-xl">$4,300.03</p>
                          </div>
                          <div className="rounded-xl border border-border bg-card/70 p-3">
                            <p className="text-[12px] uppercase tracking-wider text-text-muted">
                              Entry
                            </p>
                            <p className="mt-1 font-display text-xl">No trade</p>
                          </div>
                          <div className="rounded-xl border border-border bg-card/70 p-3">
                            <p className="text-[12px] uppercase tracking-wider text-text-muted">
                              Invalidates
                            </p>
                            <p className="mt-1 font-display text-xl">Fresh bias</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gold-action px-5 py-3 text-sm font-semibold text-[#060609] shadow-[0_14px_36px_rgba(212,168,67,0.25)] transition hover:bg-gold-actionHover">
                    <Bot className="h-4 w-4" />
                    Generate signal
                  </button>
                </div>

                <div className="relative mt-6 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-border bg-deep/40 p-4">
                    <p className="flex items-center gap-2 text-sm text-text-primary">
                      <ArrowUpRight className="h-4 w-4 text-green" />
                      Supportive evidence
                    </p>
                    <p className="mt-2 text-xs leading-5 text-text-muted">
                      XAUUSD context and lower real yields support gold.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-deep/40 p-4">
                    <p className="flex items-center gap-2 text-sm text-text-primary">
                      <ArrowDownRight className="h-4 w-4 text-red" />
                      Main blocker
                    </p>
                    <p className="mt-2 text-xs leading-5 text-text-muted">
                      CFTC positioning moved against bullish confirmation.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-deep/40 p-4">
                    <p className="flex items-center gap-2 text-sm text-text-primary">
                      <Clock3 className="h-4 w-4 text-gold" />
                      Next condition
                    </p>
                    <p className="mt-2 text-xs leading-5 text-text-muted">
                      Refresh COMEX/GLD before changing the thesis state.
                    </p>
                  </div>
                </div>
              </article>

              <aside className="grid gap-4">
                <article className="rounded-[28px] border border-border bg-surface/70 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[12px] uppercase tracking-[0.18em] text-text-muted">
                        Market snapshot
                      </p>
                      <p className="mt-2 font-display text-3xl text-text-primary">
                        $4,357.17
                      </p>
                    </div>
                    <span className="rounded-full border border-green/30 bg-green/10 px-3 py-1 text-sm text-green">
                      +5.74%
                    </span>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <MetricCard
                      label="Loaded high"
                      value="$4,367.58"
                      detail="Upper range"
                    />
                    <MetricCard
                      label="Loaded low"
                      value="$4,023.50"
                      detail="Lower range"
                    />
                  </div>
                </article>

                <article className="rounded-[28px] border border-border bg-surface/70 p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-display text-xl text-text-primary">
                      Driver health
                    </p>
                    <span className="text-sm text-text-muted">2 / 4 verified</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {drivers.map((driver) => (
                      <DriverPill key={driver.label} driver={driver} />
                    ))}
                  </div>
                </article>
              </aside>
            </section>

            <section className="grid gap-4 lg:grid-cols-4">
              {evidence.map(([label, value, detail]) => (
                <MetricCard
                  key={label}
                  label={label}
                  value={value}
                  detail={detail}
                />
              ))}
            </section>

            <SignalLifecycle />

            <SignalHistoryTable />

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
              <ChartPreview />

              <article className="rounded-3xl border border-border bg-surface/70 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[12px] uppercase tracking-[0.18em] text-gold">
                      What changed
                    </p>
                    <h2 className="mt-2 font-display text-2xl text-text-primary">
                      Thesis timeline
                    </h2>
                  </div>
                  <RefreshCw className="h-4 w-4 text-text-muted" />
                </div>

                <div className="mt-6 space-y-4">
                  {timeline.map((item, index) => (
                    <div key={item.date} className="relative pl-7">
                      <span
                        className={cn(
                          "absolute left-0 top-1.5 h-3 w-3 rounded-full",
                          index === 0 ? "bg-gold" : "bg-border",
                        )}
                      />
                      {index !== timeline.length - 1 && (
                        <span className="absolute left-[5px] top-5 h-full w-px bg-border" />
                      )}
                      <div className="rounded-2xl border border-border bg-card/70 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs text-text-muted">{item.date}</p>
                            <p className="mt-1 text-sm font-semibold text-text-primary">
                              {item.title}
                            </p>
                          </div>
                          <span className="rounded-full border border-gold/25 px-2.5 py-1 text-[12px] text-gold">
                            {item.tag}
                          </span>
                        </div>
                        <p className="mt-3 text-xs leading-5 text-text-muted">
                          {item.body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section className="rounded-3xl border border-border bg-surface/70 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[12px] uppercase tracking-[0.18em] text-gold">
                    Progressive disclosure
                  </p>
                  <h2 className="mt-2 font-display text-2xl text-text-primary">
                    Detailed evidence is hidden until requested
                  </h2>
                </div>
                <button className="inline-flex items-center gap-2 rounded-xl border border-border-gold px-4 py-2 text-sm text-gold">
                  View detailed evidence
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-border bg-card/70 p-4">
                  <LineChart className="h-5 w-5 text-green" />
                  <p className="mt-3 text-sm font-semibold text-text-primary">
                    Price context
                  </p>
                  <p className="mt-2 text-xs leading-5 text-text-muted">
                    Short summary first. Full rule, source URL, and raw value
                    move into the detail view.
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card/70 p-4">
                  <BarChart3 className="h-5 w-5 text-gold" />
                  <p className="mt-3 text-sm font-semibold text-text-primary">
                    Macro drivers
                  </p>
                  <p className="mt-2 text-xs leading-5 text-text-muted">
                    Drivers become status chips and only expand when the user
                    needs the audit trail.
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card/70 p-4">
                  <LockKeyhole className="h-5 w-5 text-text-muted" />
                  <p className="mt-3 text-sm font-semibold text-text-primary">
                    Risk note
                  </p>
                  <p className="mt-2 text-xs leading-5 text-text-muted">
                    The UI keeps the educational disclaimer, but it no longer
                    competes with the main decision.
                  </p>
                </div>
              </div>
            </section>

            <MissingDriversPanel />

            <div className="rounded-2xl border border-gold/20 bg-gold/5 p-4 text-sm leading-6 text-gold">
              <Zap className="mr-2 inline h-4 w-4" />
              Preview note: this page is static HTML for layout review only.
              It does not change the real dashboard or call live AI/data APIs.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
