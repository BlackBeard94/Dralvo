"use client";

import { ShieldCheck } from "lucide-react";

import { NavBar } from "@/components/shared/nav-bar";
import { MainNavActions } from "@/components/shared/site-nav";
import { mainNavLinks } from "@/components/shared/nav-links";
import { GlowOrb, GridPattern } from "@/components/shared/decor";
import { GOLDMASTER } from "@/lib/backtest-stats";
import { TRACK_RECORD_COPY } from "@/lib/i18n";
import { useLocale } from "@/hooks/use-locale";
import { cn } from "@/lib/utils";

/* Metrics come from the canonical GoldMaster backtest (same figure as the
   landing) — the recommended 5%-risk configuration. Labels kept in English. */
const gm = GOLDMASTER;
const gmStat = (k: string) => gm.tradeStats.find((s) => s.key === k)?.value ?? "—";
const gmStar = gm.riskMatrix.find((r) => r.star);
const gmFinal = gm.finalBalance.split("→").pop()?.trim() ?? gm.finalBalance;

const METRICS: { label: string; value: string; tone?: "good" | "bad" }[] = [
  { label: "Starting balance", value: "$10,000" },
  { label: "Final balance", value: gmFinal, tone: "good" },
  { label: "Total return", value: gm.headline[0].value, tone: "good" },
  { label: "CAGR", value: gmStar?.extra ?? "—", tone: "good" },
  { label: "Profit factor", value: gm.headline[1].value },
  { label: "Win rate", value: gmStat("winRate") },
  { label: "Trades", value: gmStat("trades") },
  { label: "Reward : Risk", value: gmStat("rr") },
  { label: "Avg win", value: gmStat("avgWin"), tone: "good" },
  { label: "Avg loss", value: gmStat("avgLoss"), tone: "bad" },
  { label: "Max drawdown (equity)", value: gmStar?.ddEquity ?? gm.headline[3].value, tone: "bad" },
  { label: "Recommended risk", value: gm.recommendedRisk },
];

export default function TrackRecordPage() {
  const { locale } = useLocale();
  const t = TRACK_RECORD_COPY[locale];

  return (
    <div className="min-h-screen overflow-x-hidden antialiased bg-deep text-text-primary">
      <NavBar
        navClassName="fixed top-0 left-0 right-0 z-50 bg-deep/85 backdrop-blur-xl border-b border-border"
        containerClassName="max-w-[1180px] mx-auto px-6"
        links={mainNavLinks(locale, "/track-record")}
        actions={<MainNavActions locale={locale} />}
      />


      <main style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        {/* Hero */}
        <section className="relative pt-32 pb-16 px-6 overflow-hidden">
          <GridPattern />
          <GlowOrb className="w-[700px] h-[600px] -top-60 -right-40" />
          <div className="max-w-[900px] mx-auto relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] tracking-[0.14em] uppercase font-medium border border-border text-text-muted mb-6">
              <ShieldCheck size={13} className="text-gold" />
              {t.nav}
            </div>
            <h1
              className="text-4xl sm:text-5xl font-normal leading-[1.08] tracking-[-0.015em] mb-5 text-balance"
              style={{ fontFamily: "'DM Serif Display', 'Playfair Display', 'Times New Roman', serif" }}
            >
              {t.title}
            </h1>
            <p className="text-base sm:text-lg leading-relaxed max-w-[640px] mx-auto text-text-secondary">
              {t.subtitle}
            </p>
          </div>
        </section>

        {/* Backtest metrics */}
        <section className="relative py-12 px-6 bg-surface">
          <div className="max-w-[1000px] mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-semibold mb-2">{gm.name} — 8-year backtest</h2>
              <p className="text-text-muted text-sm font-mono">XAUUSD · {gm.timeframe} · 2018–2026 · $10K basis · @ {gm.recommendedRisk} risk</p>
            </div>
            <div className="grid grid-cols-1  grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {METRICS.map((m) => (
                <div
                  key={m.label}
                  className="p-4 rounded-lg border border-border bg-card text-center"
                >
                  <div
                    className={cn(
                      "text-xl font-bold font-mono tracking-tight mb-1",
                      m.tone === "good"
                        ? "text-green"
                        : m.tone === "bad"
                          ? "text-red"
                          : "text-gold-bright",
                    )}
                  >
                    {m.value}
                  </div>
                  <div className="text-[10px] leading-tight tracking-[0.03em] uppercase text-text-muted">
                    {m.label}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] mt-5 text-center text-text-muted">
              MT5 Strategy Tester · {gm.name} {gm.version} · {t.backtestCaption}
            </p>
          </div>
        </section>

        {/* Honest expectations */}
        <section className="relative py-16 px-6 overflow-hidden">
          <GlowOrb className="w-[500px] h-[500px] -bottom-40 left-0 opacity-50" />
          <div className="max-w-[760px] mx-auto relative z-10">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 text-center">
              {t.expectationsHeading}
            </h2>
            <ul className="space-y-3">
              {t.expectations.map((point, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card"
                >
                  <span className="shrink-0 mt-0.5 text-gold font-mono text-sm">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm leading-relaxed text-text-secondary">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="relative py-12 px-6">
          <p className="max-w-[640px] mx-auto text-center text-[11px] leading-relaxed text-text-muted">
            {t.disclaimer}
          </p>
        </section>
      </main>
    </div>
  );
}
