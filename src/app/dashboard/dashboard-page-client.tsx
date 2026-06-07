"use client";

import { useMemo } from "react";
import { Activity, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MarketHeader } from "@/components/dashboard/market-header";
import { XauusdChart } from "@/components/dashboard/xauusd-chart";
import { IndicatorDetailCard } from "@/components/dashboard/indicator-detail-card";
import { CorrelationMatrix } from "@/components/dashboard/correlation-matrix";
import { useIndicatorStream } from "@/hooks/use-indicator-stream";

export function DashboardPageClient() {
  const { snapshots, justUpdated } = useIndicatorStream();

  const stats = useMemo(() => {
    const bullish = snapshots.filter((s) => s.status === "bullish").length;
    const neutral = snapshots.filter((s) => s.status === "neutral").length;
    const bearish = snapshots.filter((s) => s.status === "bearish").length;
    return { bullish, neutral, bearish, total: snapshots.length };
  }, [snapshots]);

  const sentimentLabel = useMemo(() => {
    if (stats.bullish >= 4) return { text: "Strongly Bullish", color: "text-green" };
    if (stats.bullish >= 3) return { text: "Moderately Bullish", color: "text-green/80" };
    if (stats.bearish >= 4) return { text: "Strongly Bearish", color: "text-red" };
    if (stats.bearish >= 3) return { text: "Moderately Bearish", color: "text-red/80" };
    return { text: "Neutral / Mixed", color: "text-gold" };
  }, [stats]);

  return (
    <DashboardShell>
      {/* ── Market Header ── */}
      <MarketHeader />

      {/* ── Main Content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 lg:p-6 space-y-5 max-w-[1440px] mx-auto">

          {/* ── Sentiment Bar ── */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-lg border border-border bg-surface/50">
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 text-gold" />
              <span className="text-xs tracking-[0.14em] uppercase text-text-muted">
                Composite Sentiment
              </span>
              <span className={`text-sm font-semibold font-display ${sentimentLabel.color}`}>
                {sentimentLabel.text}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-green" />
                <span className="text-green font-mono">{stats.bullish}</span>
                <span>Bullish</span>
              </span>
              <span className="flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-gold-dim" />
                <span className="text-gold-dim font-mono">{stats.neutral}</span>
                <span>Neutral</span>
              </span>
              <span className="flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-red" />
                <span className="text-red font-mono">{stats.bearish}</span>
                <span>Bearish</span>
              </span>
            </div>
          </div>

          {/* ── XAUUSD Chart ── */}
          <section>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-1 h-5 rounded-full bg-gold" />
              <h2 className="font-display text-lg text-text-primary tracking-[-0.01em]">
                XAUUSD Price Chart
              </h2>
              <span className="text-[10px] tracking-[0.14em] uppercase text-text-muted mt-0.5">
                Candlestick · SMA 9/20 · Volume
              </span>
            </div>
            <XauusdChart />
          </section>

          {/* ── Indicator Surface ── */}
          <section>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-1 h-5 rounded-full bg-gold" />
              <h2 className="font-display text-lg text-text-primary tracking-[-0.01em]">
                Indicator Surface
              </h2>
              <span className="text-[10px] tracking-[0.14em] uppercase text-text-muted mt-0.5">
                6 indicators · live mock stream
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {snapshots.map((indicator) => (
                <IndicatorDetailCard
                  key={indicator.key}
                  indicator={indicator}
                  justUpdated={justUpdated.has(indicator.key)}
                />
              ))}
            </div>
          </section>

          {/* ── Correlation Matrix ── */}
          <section>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-1 h-5 rounded-full bg-gold" />
              <h2 className="font-display text-lg text-text-primary tracking-[-0.01em]">
                Cross-Asset Correlation
              </h2>
              <span className="text-[10px] tracking-[0.14em] uppercase text-text-muted mt-0.5">
                7×7 Heatmap
              </span>
            </div>
            <CorrelationMatrix />
          </section>

        </div>
      </div>
    </DashboardShell>
  );
}
