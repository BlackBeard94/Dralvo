"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  XAUUSD_SPOT,
  XAUUSD_SPOT_LABEL,
  type IndicatorSnapshot,
} from "@/data/indicators";
import { useIndicatorStream } from "@/hooks/use-indicator-stream";

/* ─── Scroll-reveal ─── */
function useScrollReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.1) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      const frame = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

/* ─── Mini SVG Sparkline ─── */
function MiniSparkline({ data, width = 80, height = 28, bullish }: { data: number[]; width?: number; height?: number; bullish?: boolean }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const paddingX = 2;
  const usableW = width - paddingX * 2;
  const stepX = usableW / (data.length - 1);

  const points = data
    .map((v, i) => {
      const x = paddingX + i * stepX;
      const y = height - 4 - ((v - min) / range) * (height - 8);
      return `${x},${y}`;
    })
    .join(" ");

  const color = bullish === undefined ? "var(--gold-primary)" : bullish ? "var(--green)" : "var(--red)";

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
    </svg>
  );
}

/* ─── Indicator Card ─── */
function createSparklineData(indicator: IndicatorSnapshot) {
  const trend =
    indicator.status === "bullish" ? 0.6 : indicator.status === "bearish" ? -0.4 : 0;
  let seed = Array.from(indicator.key).reduce(
    (value, character) => (value * 31 + character.charCodeAt(0)) >>> 0,
    2166136261
  );
  let value = 0;

  return Array.from({ length: 12 }, () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const noise = seed / 4294967296;
    value += trend + (noise - 0.45) * 0.8;
    return value;
  });
}

function IndicatorCard({ indicator, delay, justUpdated = false }: { indicator: IndicatorSnapshot; delay: number; justUpdated?: boolean }) {
  const { ref, visible } = useScrollReveal(0.05);

  const statusColor =
    indicator.status === "bullish" ? "var(--green)" : indicator.status === "bearish" ? "var(--red)" : "var(--gold-primary)";
  const statusLabel =
    indicator.status === "bullish" ? "Bullish" : indicator.status === "bearish" ? "Bearish" : "Neutral";
  const statusBg =
    indicator.status === "bullish"
      ? "rgba(59,168,126,0.1)"
      : indicator.status === "bearish"
        ? "rgba(232,72,59,0.1)"
        : "rgba(212,168,67,0.1)";

  const sparklineData = createSparklineData(indicator);

  return (
    <div
      ref={ref}
      className={cn(
        "bg-card border border-border rounded-lg p-4 transition-all duration-700 hover:border-border-gold group",
        justUpdated && "border-gold/60 shadow-[0_0_12px_rgba(212,168,67,0.12)]",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-text-secondary tracking-[0.03em]">
            {indicator.name}
          </span>
        </div>
        <span
          className="text-[10px] font-mono px-2 py-0.5 rounded-full"
          style={{ color: statusColor, background: statusBg }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Value + sparkline row */}
      <div className="flex items-end justify-between mb-2">
        <div>
          <span className="font-mono text-lg font-semibold text-text-primary">
            {indicator.value}
          </span>
          <span
            className={cn(
              "font-mono text-[11px] ml-2",
              indicator.change.startsWith("+") ? "text-green" : indicator.change.startsWith("-") ? "text-red" : "text-text-muted"
            )}
          >
            {indicator.change}
          </span>
        </div>
        <MiniSparkline
          data={sparklineData}
          bullish={indicator.status === "bullish" ? true : indicator.status === "bearish" ? false : undefined}
        />
      </div>

      {/* Summary */}
      <p className="text-[11px] text-text-muted leading-relaxed line-clamp-2">
        {indicator.summary}
      </p>

      {/* Source + cadence footer */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/50">
        <span className="text-[10px] text-text-muted font-mono">{indicator.source.split("+")[0].trim()}</span>
        <span className="text-[10px] text-text-muted font-mono opacity-60">{indicator.cadence}</span>
      </div>
    </div>
  );
}

/* ─── Mini Candlestick Chart (simplified SVG) ─── */
function MiniCandlestickChart() {
  const candles = [
    { o: 4340, h: 4352, l: 4335, c: 4348 },
    { o: 4348, h: 4355, l: 4342, c: 4345 },
    { o: 4345, h: 4358, l: 4340, c: 4356 },
    { o: 4356, h: 4365, l: 4350, c: 4362 },
    { o: 4362, h: 4370, l: 4358, c: 4360 },
    { o: 4360, h: 4368, l: 4352, c: 4355 },
    { o: 4355, h: 4364, l: 4350, c: 4361 },
    { o: 4361, h: 4375, l: 4358, c: 4372 },
    { o: 4372, h: 4378, l: 4365, c: 4368 },
    { o: 4368, h: 4374, l: 4360, c: 4363 },
    { o: 4363, h: 4372, l: 4358, c: 4370 },
  ];

  const w = 280;
  const h = 120;
  const pad = { top: 8, right: 8, bottom: 16, left: 8 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;

  const allPrices = candles.flatMap((c) => [c.h, c.l]);
  const min = Math.min(...allPrices);
  const max = Math.max(...allPrices);
  const range = max - min || 1;

  const candleW = Math.max(2, (chartW / candles.length) * 0.6);
  const gap = chartW / candles.length;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="w-full">
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((frac) => {
        const y = pad.top + chartH * (1 - frac);
        return (
          <line
            key={`grid-${frac}`}
            x1={pad.left}
            y1={y}
            x2={w - pad.right}
            y2={y}
            stroke="var(--bg-border)"
            strokeWidth="0.5"
            strokeDasharray="2 3"
            opacity="0.5"
          />
        );
      })}

      {/* Candles */}
      {candles.map((c, i) => {
        const x = pad.left + i * gap + gap / 2;
        const yOpen = pad.top + chartH * (1 - (c.o - min) / range);
        const yClose = pad.top + chartH * (1 - (c.c - min) / range);
        const yHigh = pad.top + chartH * (1 - (c.h - min) / range);
        const yLow = pad.top + chartH * (1 - (c.l - min) / range);
        const bullish = c.c >= c.o;
        const color = bullish ? "var(--green)" : "var(--red)";
        const bodyTop = Math.min(yOpen, yClose);
        const bodyH = Math.max(Math.abs(yClose - yOpen), 1);

        return (
          <g key={i}>
            {/* Wick */}
            <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth="0.8" />
            {/* Body */}
            <rect
              x={x - candleW / 2}
              y={bodyTop}
              width={candleW}
              height={bodyH}
              fill={color}
              rx="0.5"
            />
          </g>
        );
      })}

      {/* Current price line */}
      <line
        x1={pad.left}
        y1={pad.top + chartH * (1 - (XAUUSD_SPOT - min) / range)}
        x2={w - pad.right}
        y2={pad.top + chartH * (1 - (XAUUSD_SPOT - min) / range)}
        stroke="var(--gold-primary)"
        strokeWidth="0.8"
        strokeDasharray="3 2"
        opacity="0.7"
      />
    </svg>
  );
}

/* ─── Main Dashboard Mockup ─── */
export function DashboardMockup() {
  const { ref, visible } = useScrollReveal(0.05);
  const { snapshots, justUpdated } = useIndicatorStream();

  const bullishCount = snapshots.filter((s) => s.status === "bullish").length;
  const neutralCount = snapshots.filter((s) => s.status === "neutral").length;
  const bearishCount = snapshots.filter((s) => s.status === "bearish").length;

  return (
    <div
      ref={ref}
      className={cn(
        "relative bg-surface border border-border rounded-2xl overflow-hidden shadow-[0_32px_64px_rgba(0,0,0,0.4),0_0_0_1px_rgba(212,168,67,0.05)] transition-all duration-1000",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      )}
    >
      {/* ── Title bar ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-gold-bright/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-green/70" />
          </div>
          <span className="text-[11px] text-text-muted font-mono ml-1">Dralvo · Dashboard Preview</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-text-muted font-mono">Live</span>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green" />
          </span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-6 space-y-5">
        {/* Price header row */}
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-xs text-text-muted tracking-[0.08em] uppercase">XAUUSD</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-green/10 text-green border border-green/20">
                +12.40
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-3xl font-semibold text-gold tracking-[-0.02em]">
                {XAUUSD_SPOT_LABEL}
              </span>
              <span className="text-xs text-text-muted font-mono">USD</span>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-6">
            {[
              { label: "24H High", value: "4,378.60" },
              { label: "24H Low", value: "4,340.20" },
              { label: "Vol", value: "142.3K" },
            ].map((stat) => (
              <div key={stat.label} className="text-right">
                <div className="text-[10px] text-text-muted font-mono uppercase tracking-[0.05em]">{stat.label}</div>
                <div className="font-mono text-xs text-text-secondary">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart area */}
        <div className="bg-card/50 border border-border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            {["1H", "4H", "1D", "1W"].map((tf) => (
              <button
                key={tf}
                type="button"
                className={cn(
                  "text-[10px] font-mono px-2.5 py-1 rounded transition-colors",
                  tf === "4H"
                    ? "bg-gold/15 text-gold border border-border-gold"
                    : "text-text-muted hover:text-text-secondary"
                )}
              >
                {tf}
              </button>
            ))}
          </div>
          <MiniCandlestickChart />
        </div>

        {/* Indicator cards grid — 3 columns on desktop, 2 on tablet, 1 on mobile */}
        <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {snapshots.map((indicator, i) => (
            <IndicatorCard
              key={indicator.key}
              indicator={indicator}
              delay={i * 80}
              justUpdated={justUpdated.has(indicator.key)}
            />
          ))}
        </div>

        {/* Bottom status bar */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-text-muted font-mono">
              Data as of {snapshots[0]?.observedLabel ?? "—"}
            </span>
            <span className="text-[10px] text-text-muted font-mono opacity-60">
              6 indicators · {bullishCount} bullish · {neutralCount} neutral{bearishCount > 0 ? ` · ${bearishCount} bearish` : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-text-muted font-mono">Auto-refresh</span>
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gold" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
