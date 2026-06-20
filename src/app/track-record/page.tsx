"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck, TrendingUp } from "lucide-react";

import { BrandLink } from "@/components/shared/brand";
import { GlowOrb, GridPattern } from "@/components/shared/decor";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { DRALVO_BACKTEST } from "@/lib/backtest-stats";
import { TRACK_RECORD_COPY } from "@/lib/i18n";
import { useLocale } from "@/hooks/use-locale";
import { cn } from "@/lib/utils";

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

/** Trading metric labels are kept in English (universal in trading UIs). */
const METRICS: { label: string; value: string; tone?: "good" | "bad" }[] = [
  { label: "Starting balance", value: usd(DRALVO_BACKTEST.initialDeposit) },
  { label: "Net profit", value: `+${usd(DRALVO_BACKTEST.netProfit)}`, tone: "good" },
  { label: "Total return", value: `+${DRALVO_BACKTEST.netProfitPct}%`, tone: "good" },
  { label: "Profit factor", value: DRALVO_BACKTEST.profitFactor.toFixed(2) },
  {
    label: "Win rate",
    value: `${(DRALVO_BACKTEST.winRate * 100).toFixed(1)}%`,
  },
  {
    label: "Trades",
    value: `${DRALVO_BACKTEST.totalTrades} (${DRALVO_BACKTEST.wins}W / ${DRALVO_BACKTEST.losses}L)`,
  },
  { label: "Avg win", value: `+${usd(DRALVO_BACKTEST.avgWin)}`, tone: "good" },
  { label: "Avg loss", value: `-${usd(DRALVO_BACKTEST.avgLoss)}`, tone: "bad" },
  { label: "Reward : Risk", value: `${DRALVO_BACKTEST.rewardRisk} : 1` },
  {
    label: "Max drawdown (equity)",
    value: `${DRALVO_BACKTEST.maxEquityDrawdownPct}%`,
    tone: "bad",
  },
  {
    label: "Max losing streak",
    value: `${DRALVO_BACKTEST.maxConsecutiveLosses}`,
    tone: "bad",
  },
  { label: "Sharpe / Recovery", value: `${DRALVO_BACKTEST.sharpeRatio} / ${DRALVO_BACKTEST.recoveryFactor}` },
];

const MYFXBOOK_URL = process.env.NEXT_PUBLIC_MYFXBOOK_EMBED_URL;

export default function TrackRecordPage() {
  const { locale } = useLocale();
  const t = TRACK_RECORD_COPY[locale];

  return (
    <div className="min-h-screen overflow-x-hidden antialiased bg-deep text-text-primary">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-deep/85 backdrop-blur-xl border-b border-border">
        <div className="max-w-[1100px] mx-auto px-6 h-16 flex items-center justify-between">
          <BrandLink />
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[13px] text-text-muted hover:text-gold transition-colors no-underline"
            >
              <ArrowLeft size={14} />
              {t.back}
            </Link>
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
      </nav>

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
              <h2 className="text-2xl sm:text-3xl font-semibold mb-2">{t.backtestHeading}</h2>
              <p className="text-text-muted text-sm font-mono">{t.backtestNote}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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
              {DRALVO_BACKTEST.source} · {DRALVO_BACKTEST.strategy}
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

        {/* Live track record (Myfxbook) */}
        <section className="relative py-16 px-6 bg-surface">
          <div className="max-w-[900px] mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-semibold mb-2 inline-flex items-center gap-2 justify-center">
                <TrendingUp size={22} className="text-gold" />
                {t.liveHeading}
              </h2>
            </div>
            {MYFXBOOK_URL ? (
              <div className="rounded-xl border border-border overflow-hidden bg-card">
                <iframe
                  src={MYFXBOOK_URL}
                  title="Myfxbook track record"
                  className="w-full h-[520px]"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
                <p className="text-text-secondary text-sm leading-relaxed max-w-[520px] mx-auto">
                  {t.liveSoon}
                </p>
              </div>
            )}
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
