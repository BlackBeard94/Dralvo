"use client";

import { useMemo } from "react";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

import type {
  IndicatorHistoryPoint,
  IndicatorSnapshot,
} from "@/data/indicators";
import { cn } from "@/lib/utils";

/* Types */

export interface IndicatorDetailCardProps {
  indicator: IndicatorSnapshot;
  history?: IndicatorHistoryPoint[];
  justUpdated?: boolean;
}

/* Category config */

const categoryConfig: Record<string, { label: string; className: string }> = {
  "xauusd-spot": {
    label: "Price",
    className: "text-gold-400/80 border-gold-400/20 bg-gold-400/8",
  },
  "xauusd-rsi": {
    label: "Momentum",
    className: "text-sky-400/80 border-sky-400/20 bg-sky-400/8",
  },
  "xauusd-macd": {
    label: "Trend",
    className: "text-violet-400/80 border-violet-400/20 bg-violet-400/8",
  },
  "xauusd-sma": {
    label: "Trend",
    className: "text-indigo-400/80 border-indigo-400/20 bg-indigo-400/8",
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

const dataQualityConfig = {
  live: {
    label: "Live",
    className: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  },
  delayed: {
    label: "Delayed",
    className: "border-sky-400/25 bg-sky-400/10 text-sky-300",
  },
  estimated: {
    label: "Estimated",
    className: "border-amber-400/25 bg-amber-400/10 text-amber-300",
  },
  simulated: {
    label: "Simulated",
    className: "border-zinc-400/25 bg-zinc-400/10 text-zinc-300",
  },
} as const;

/* Signal logic */

interface SignalInfo {
  signal: "bullish" | "bearish" | "neutral";
  text: string;
}

function getSignalInfo(indicator: IndicatorSnapshot): SignalInfo {
  const { key, status } = indicator;

  switch (key) {
    case "xauusd-spot":
      return {
        signal: status,
        text:
          status === "bullish"
            ? "Gold price rising - bullish momentum"
            : status === "bearish"
              ? "Gold price declining - bearish pressure"
              : "Gold price stable - consolidation phase",
      };
    case "xauusd-rsi":
      return {
        signal: status,
        text:
          status === "bullish"
            ? "RSI above 60 - strong upward momentum"
            : status === "bearish"
              ? "RSI below 40 - oversold, potential reversal"
              : "RSI in neutral zone - no directional bias",
      };
    case "xauusd-macd":
      return {
        signal: status,
        text:
          status === "bullish"
            ? "MACD above signal line - uptrend confirmed"
            : status === "bearish"
              ? "MACD below signal line - downtrend in play"
              : "MACD at signal line - trend transition",
      };
    case "xauusd-sma":
      return {
        signal: status,
        text:
          status === "bullish"
            ? "Golden Cross active - long-term uptrend"
            : status === "bearish"
              ? "Death Cross active - long-term downtrend"
              : "SMAs converging - trend uncertainty",
      };
    case "tips-yields":
      return {
        signal: status,
        text:
          status === "bullish"
            ? "Real yields falling - gold attractive"
            : status === "bearish"
              ? "Real yields rising - headwind for gold"
              : "Real yields stable - neutral macro backdrop",
      };
    case "gold-btc-correlation":
      return {
        signal: status,
        text:
          status === "bullish"
            ? "Negative correlation - gold as safe haven"
            : status === "bearish"
              ? "High positive correlation - risk-on mode"
              : "Low correlation - gold trades on own drivers",
      };
    default:
      return { signal: "neutral", text: "" };
  }
}

/* Sparkline SVG sub-component */

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
/* Mini stat helpers */

interface MiniStats {
  high7d: number;
  low7d: number;
  avg30d: number;
}

function computeMiniStats(data: number[]): MiniStats | null {
  if (data.length < 2) return null;

  const high7d = Math.max(...data);
  const low7d = Math.min(...data);
  const avg30d = data.reduce((a, b) => a + b, 0) / data.length;

  return { high7d, low7d, avg30d };
}

function formatStatValue(value: number, indicatorKey: string): string {
  switch (indicatorKey) {
    case "xauusd-spot":
      return `$${value.toFixed(1)}`;
    case "xauusd-rsi":
      return value.toFixed(1);
    case "xauusd-macd":
      return value.toFixed(4);
    case "xauusd-sma":
      return `$${value.toFixed(1)}`;
    case "tips-yields":
      return `${value.toFixed(2)}%`;
    case "gold-btc-correlation":
      return value.toFixed(2);
    default:
      return value.toFixed(1);
  }
}

/* Main card component */

export function IndicatorDetailCard({
  indicator,
  history = [],
  justUpdated = false,
}: IndicatorDetailCardProps) {
  const signalInfo = useMemo(() => getSignalInfo(indicator), [indicator]);
  const category = categoryConfig[indicator.key] ?? {
    label: "Other",
    className: "text-zinc-400/80 border-zinc-400/20 bg-zinc-400/8",
  };
  const dataQuality = indicator.dataQuality ?? "delayed";
  const quality = dataQualityConfig[dataQuality] ?? dataQualityConfig.delayed;

  const snapshotHistory = useMemo(
    () => history.map((point) => point.value),
    [history],
  );
  const hasSnapshotHistory = snapshotHistory.length >= 2;
  const hasSourceSeries = Boolean(indicator.sparkline && indicator.sparkline.length >= 2);
  const sparkData = useMemo(
    () =>
      hasSnapshotHistory
        ? snapshotHistory
        : hasSourceSeries
          ? indicator.sparkline!
          : [],
    [
      hasSnapshotHistory,
      hasSourceSeries,
      indicator.sparkline,
      snapshotHistory,
    ],
  );
  const miniStats = useMemo(() => computeMiniStats(sparkData), [sparkData]);

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
      {/* Header row */}
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

        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-[12px] font-medium uppercase tracking-[0.12em]",
              quality.className,
            )}
            title={indicator.qualityNote ?? `Data quality: ${quality.label}`}
          >
            {quality.label}
          </span>
          <span
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-[12px] font-medium uppercase tracking-[0.12em]",
              category.className,
            )}
          >
            {category.label}
          </span>
        </div>
      </div>

      {/* Current value */}
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex flex-col">
          <span className="font-mono text-3xl font-semibold tracking-tight text-[var(--gold-bright)]">
            {indicator.value}
          </span>
          <span className="mt-0.5 text-[13px] text-[var(--text-muted)] font-mono">
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

      {/* Sparkline chart */}
      <div className="relative -mx-1">
        <div className="mb-1 flex items-center justify-between px-1">
          <span className="text-[12px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
            {hasSnapshotHistory
              ? "Snapshot history"
              : hasSourceSeries
                ? "Source series"
                : "Collecting history"}
          </span>
          <span className="rounded-full border border-[var(--bg-border)] px-2 py-0.5 text-[13px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
            {sparkData.length} point{sparkData.length === 1 ? "" : "s"}
          </span>
        </div>
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

      {/* Signal interpretation */}
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

      {/* Mini stats row */}
      <div className="grid grid-cols-3 gap-2 border-t border-[var(--bg-border)] pt-3.5">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[12px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
            History High
          </span>
          <span className="font-mono text-xs font-medium text-[var(--text-primary)]">
            {miniStats ? formatStatValue(miniStats.high7d, indicator.key) : "-"}
          </span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[12px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
            History Low
          </span>
          <span className="font-mono text-xs font-medium text-[var(--text-primary)]">
            {miniStats ? formatStatValue(miniStats.low7d, indicator.key) : "-"}
          </span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[12px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
            History Avg
          </span>
          <span className="font-mono text-xs font-medium text-[var(--text-primary)]">
            {miniStats ? formatStatValue(miniStats.avg30d, indicator.key) : "-"}
          </span>
        </div>
      </div>

      {/* Footer: source + timestamp */}
      <div className="flex items-center justify-between border-t border-[var(--bg-border)] pt-3 text-[12px] text-[var(--text-muted)]">
        <span className="truncate max-w-[60%]" title={indicator.source}>
          {indicator.source}
        </span>
        <span className="font-mono shrink-0">{indicator.observedLabel}</span>
      </div>
    </article>
  );
}

