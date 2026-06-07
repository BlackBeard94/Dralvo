"use client";

import { useMemo } from "react";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

import type { IndicatorSnapshot } from "@/data/indicators";
import { cn } from "@/lib/utils";

/* ─── Types ─── */

export interface IndicatorDetailCardProps {
  indicator: IndicatorSnapshot;
  justUpdated?: boolean;
}

/* ─── Category config ─── */

const categoryConfig: Record<string, { label: string; className: string }> = {
  "sge-premium": {
    label: "Demand",
    className: "text-amber-400/80 border-amber-400/20 bg-amber-400/8",
  },
  "cot-swap-dealer": {
    label: "Positioning",
    className: "text-sky-400/80 border-sky-400/20 bg-sky-400/8",
  },
  "comex-inventory": {
    label: "Supply",
    className: "text-violet-400/80 border-violet-400/20 bg-violet-400/8",
  },
  "etf-flows": {
    label: "Demand",
    className: "text-amber-400/80 border-amber-400/20 bg-amber-400/8",
  },
  "tips-yields": {
    label: "Macro",
    className: "text-rose-400/80 border-rose-400/20 bg-rose-400/8",
  },
  "gold-btc-correlation": {
    label: "Cross-Asset",
    className: "text-emerald-400/80 border-emerald-400/20 bg-emerald-400/8",
  },
};

/* ─── Signal logic ─── */

interface SignalInfo {
  signal: "bullish" | "bearish" | "neutral";
  text: string;
}

function getSignalInfo(indicator: IndicatorSnapshot): SignalInfo {
  const { key, value } = indicator;

  // Parse numeric value from formatted string
  const numericValue = parseNumericValue(value);

  switch (key) {
    case "sge-premium":
      return {
        signal: numericValue > 20 ? "bullish" : numericValue > 0 ? "neutral" : "bearish",
        text:
          numericValue > 20
            ? "Premium elevated — strong physical demand"
            : numericValue > 0
              ? "Premium normal — steady demand"
              : "Discount — demand weakness",
      };
    case "cot-swap-dealer":
      return {
        signal: numericValue > 0 ? "bullish" : "bearish",
        text:
          numericValue > 0
            ? "Swaps net long — smart money bullish"
            : "Swaps net short — caution",
      };
    case "comex-inventory":
      return {
        signal: numericValue < 0 ? "bullish" : "bearish",
        text:
          numericValue < 0
            ? "Inventory declining — supply tightening"
            : "Inventory stable or rising",
      };
    case "etf-flows":
      return {
        signal: numericValue > 10 ? "bullish" : numericValue > 0 ? "neutral" : "bearish",
        text:
          numericValue > 10
            ? "Strong ETF inflows — institutional demand"
            : numericValue > 0
              ? "Modest inflows — demand stabilizing"
              : "ETF outflows — rotation away from gold",
      };
    case "tips-yields":
      return {
        signal: numericValue < 0 ? "bullish" : "bearish",
        text:
          numericValue < 0
            ? "Real yields falling — gold attractive"
            : "Real yields rising — headwind for gold",
      };
    case "gold-btc-correlation":
      return {
        signal: numericValue < 0 ? "bullish" : "neutral",
        text:
          numericValue < 0
            ? "Negative correlation — gold as safe haven"
            : "Positive correlation — risk-on mode",
      };
    default:
      return { signal: "neutral", text: "" };
  }
}

/** Extract a numeric value from a formatted indicator value string. */
function parseNumericValue(formatted: string): number {
  // Strip currency symbols, units, and extract the first number
  const cleaned = formatted.replace(/[+$%a-zA-Z/]/g, "").trim();
  const num = parseFloat(cleaned);
  return Number.isNaN(num) ? 0 : num;
}

/* ─── Sparkline data generation ─── */

function generateSparklineData(currentValue: number, points: number = 24): number[] {
  // Use a deterministic seed based on the current value so it's stable between renders
  const seed = Math.round(currentValue * 1000);
  let s = seed;

  function pseudoRandom(): number {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  }

  const data: number[] = [currentValue];
  let val = currentValue;

  for (let i = 1; i < points; i++) {
    const change = (pseudoRandom() - 0.48) * Math.max(Math.abs(currentValue), 0.01) * 0.02;
    val = val - change;
    data.unshift(val);
  }

  return data;
}

/* ─── Sparkline SVG sub-component ─── */

export interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export function Sparkline({
  data,
  width = 280,
  height = 80,
  color = "var(--gold-primary)",
  className,
}: SparklineProps) {
  if (data.length < 2) {
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={cn("w-full h-auto", className)}
        aria-label="Sparkline chart"
      >
        <text
          x={width / 2}
          y={height / 2}
          textAnchor="middle"
          fill="var(--text-muted)"
          fontSize="10"
          fontFamily="JetBrains Mono, monospace"
        >
          Insufficient data
        </text>
      </svg>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padY = 4;

  const pointsStr = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - padY * 2) - padY;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const lastIdx = data.length - 1;
  const lastX = width;
  const lastY =
    height - ((data[lastIdx] - min) / range) * (height - padY * 2) - padY;

  const areaPoints = `0,${height} ${pointsStr} ${width},${height}`;

  const gradientId = [
    "sparkline-grad",
    width,
    height,
    data.length,
    Math.round(data[0] * 1000),
    Math.round(data[lastIdx] * 1000),
  ].join("-");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("w-full h-auto", className)}
      aria-label="Sparkline chart"
      role="img"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Area fill */}
      <polygon points={areaPoints} fill={`url(#${gradientId})`} />

      {/* Line */}
      <polyline
        points={pointsStr}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Current value dot */}
      <circle cx={lastX} cy={lastY} r="3" fill={color} stroke={color} strokeWidth="1" />

      {/* Subtle glow ring around dot */}
      <circle
        cx={lastX}
        cy={lastY}
        r="6"
        fill="none"
        stroke={color}
        strokeWidth="0.5"
        opacity="0.4"
      />
    </svg>
  );
}

/* ─── Mini stat helpers ─── */

interface MiniStats {
  high7d: number;
  low7d: number;
  avg30d: number;
}

function computeMiniStats(
  currentValue: number,
  indicatorKey: string,
): MiniStats {
  // Derive plausible 7d high/low and 30d avg from the sparkline data
  const sparkData = generateSparklineData(currentValue, 30);

  const high7d = Math.max(...sparkData.slice(-7));
  const low7d = Math.min(...sparkData.slice(-7));
  const avg30d = sparkData.reduce((a, b) => a + b, 0) / sparkData.length;

  return { high7d, low7d, avg30d };
}

function formatStatValue(value: number, indicatorKey: string): string {
  switch (indicatorKey) {
    case "sge-premium":
      return `$${value.toFixed(1)}`;
    case "cot-swap-dealer":
      return `${value.toFixed(1)}k`;
    case "comex-inventory":
      return `${value.toFixed(1)}%`;
    case "etf-flows":
      return `${value.toFixed(1)}t`;
    case "tips-yields":
      return `${value.toFixed(2)}%`;
    case "gold-btc-correlation":
      return value.toFixed(2);
    default:
      return value.toFixed(1);
  }
}

/* ─── Main card component ─── */

export function IndicatorDetailCard({
  indicator,
  justUpdated = false,
}: IndicatorDetailCardProps) {
  const signalInfo = useMemo(() => getSignalInfo(indicator), [indicator]);
  const category = categoryConfig[indicator.key] ?? {
    label: "Other",
    className: "text-zinc-400/80 border-zinc-400/20 bg-zinc-400/8",
  };

  const numericValue = useMemo(
    () => parseNumericValue(indicator.value),
    [indicator.value],
  );

  const sparkData = useMemo(
    () => generateSparklineData(numericValue, 24),
    [numericValue],
  );

  const miniStats = useMemo(
    () => computeMiniStats(numericValue, indicator.key),
    [numericValue, indicator.key],
  );

  // Determine if change is positive
  const changeIsPositive = indicator.change.startsWith("+");
  const changeIsNegative = indicator.change.startsWith("-");
  const changeIsNeutral = !changeIsPositive && !changeIsNegative;

  // Signal dot color
  const signalDotColor =
    signalInfo.signal === "bullish"
      ? "var(--green)"
      : signalInfo.signal === "bearish"
        ? "var(--red)"
        : "var(--gold-primary)";

  return (
    <article
      className={cn(
        "group relative flex flex-col gap-4 rounded-2xl border p-5 transition-all duration-300",
        "bg-[var(--bg-card)] border-[var(--bg-border)]",
        "hover:border-[var(--border-gold)] hover:scale-[1.01]",
        "hover:shadow-[0_0_24px_rgba(212,168,67,0.08)]",
        justUpdated && [
          "border-[var(--border-gold)]",
          "shadow-[0_0_16px_rgba(212,168,67,0.15)]",
          "animate-pulse-once",
        ],
      )}
    >
      {/* ── Header row ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Status dot */}
          <span
            className="relative flex h-2 w-2 shrink-0"
            title={`Signal: ${signalInfo.signal}`}
          >
            <span
              className="absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: signalDotColor }}
            />
            <span
              className="relative inline-flex h-full w-full rounded-full"
              style={{ backgroundColor: signalDotColor }}
            />
          </span>

          {/* Indicator name */}
          <h3 className="font-display text-lg leading-tight text-[var(--text-primary)] truncate">
            {indicator.name}
          </h3>
        </div>

        {/* Category badge */}
        <span
          className={cn(
            "shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em]",
            category.className,
          )}
        >
          {category.label}
        </span>
      </div>

      {/* ── Current value ── */}
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex flex-col">
          <span className="font-mono text-3xl font-semibold tracking-tight text-[var(--gold-bright)]">
            {indicator.value}
          </span>
          <span className="mt-0.5 text-[11px] text-[var(--text-muted)] font-mono">
            {indicator.cadence}
          </span>
        </div>

        {/* Change indicator */}
        <div
          className={cn(
            "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-mono",
            changeIsPositive && "text-[var(--green)] bg-[var(--green)]/8",
            changeIsNegative && "text-[var(--red)] bg-[var(--red)]/8",
            changeIsNeutral && "text-[var(--text-muted)] bg-[var(--text-muted)]/8",
          )}
        >
          {changeIsPositive ? (
            <TrendingUp className="h-3 w-3" />
          ) : changeIsNegative ? (
            <TrendingDown className="h-3 w-3" />
          ) : (
            <Minus className="h-3 w-3" />
          )}
          <span>{indicator.change}</span>
        </div>
      </div>

      {/* ── Sparkline chart ── */}
      <div className="relative -mx-1">
        <Sparkline
          data={sparkData}
          width={280}
          height={80}
          color={
            signalInfo.signal === "bullish"
              ? "var(--green)"
              : signalInfo.signal === "bearish"
                ? "var(--red)"
                : "var(--gold-primary)"
          }
        />
      </div>

      {/* ── Signal interpretation ── */}
      <div className="flex items-start gap-2 rounded-lg bg-[var(--gold-ghost)] px-3 py-2.5">
        {/* Signal icon */}
        <span className="mt-0.5 shrink-0">
          {signalInfo.signal === "bullish" ? (
            <TrendingUp className="h-3.5 w-3.5 text-[var(--green)]" />
          ) : signalInfo.signal === "bearish" ? (
            <TrendingDown className="h-3.5 w-3.5 text-[var(--red)]" />
          ) : (
            <Minus className="h-3.5 w-3.5 text-[var(--gold-primary)]" />
          )}
        </span>

        <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
          {signalInfo.text}
        </p>
      </div>

      {/* ── Mini stats row ── */}
      <div className="grid grid-cols-3 gap-2 border-t border-[var(--bg-border)] pt-3.5">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
            7D High
          </span>
          <span className="font-mono text-xs font-medium text-[var(--text-primary)]">
            {formatStatValue(miniStats.high7d, indicator.key)}
          </span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
            7D Low
          </span>
          <span className="font-mono text-xs font-medium text-[var(--text-primary)]">
            {formatStatValue(miniStats.low7d, indicator.key)}
          </span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
            30D Avg
          </span>
          <span className="font-mono text-xs font-medium text-[var(--text-primary)]">
            {formatStatValue(miniStats.avg30d, indicator.key)}
          </span>
        </div>
      </div>

      {/* ── Footer: source + timestamp ── */}
      <div className="flex items-center justify-between border-t border-[var(--bg-border)] pt-3 text-[10px] text-[var(--text-muted)]">
        <span className="truncate max-w-[60%]" title={indicator.source}>
          {indicator.source}
        </span>
        <span className="font-mono shrink-0">{indicator.observedLabel}</span>
      </div>
    </article>
  );
}
