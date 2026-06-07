"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  dashboardCandles as fallbackCandles,
  XAUUSD_SPOT as fallbackSpot,
  type CandleOHLC,
} from "@/data/indicators";
import { cn } from "@/lib/utils";

/* ── Constants ───────────────────────────────────────────────── */

const POLL_INTERVAL_MS = 60_000;

const CHART_W = 780;
const CHART_H = 320;
const VOLUME_H = 60;
const PAD_L = 60;
const PAD_R = 16;
const PAD_T = 16;
const PAD_B = 28;
const PLOT_W = CHART_W - PAD_L - PAD_R;
const PLOT_H = CHART_H - PAD_T - PAD_B;
const VOLUME_PAD_B = 14;
const VOLUME_PLOT_H = VOLUME_H - VOLUME_PAD_B;

/* ── Types ───────────────────────────────────────────────────── */

interface VolumeBar {
  value: number;
  bullish: boolean;
}

interface Crosshair {
  x: number;
  price: number;
  index: number;
  visible: boolean;
}

/* ── Helpers ─────────────────────────────────────────────────── */

function computeBounds(candles: CandleOHLC[]) {
  let min = Infinity;
  let max = -Infinity;
  for (const c of candles) {
    if (c.low < min) min = c.low;
    if (c.high > max) max = c.high;
  }
  const pad = (max - min) * 0.004;
  return { min: min - pad, max: max + pad };
}

function priceToY(price: number, min: number, max: number) {
  return PAD_T + PLOT_H * (1 - (price - min) / (max - min));
}

function computeSMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += data[j];
      }
      result.push(sum / period);
    }
  }
  return result;
}

function generateVolume(candle: CandleOHLC, index: number): number {
  const seededNoise = ((index * 9301 + 49297) % 233280) / 233280;
  return Math.round(
    (candle.high - candle.low) * candle.close * 0.1 + seededNoise * 500,
  );
}

function niceGridLines(min: number, max: number): number[] {
  const range = max - min;
  const rawStep = range / 6;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / magnitude;
  let niceStep: number;
  if (residual <= 1.5) niceStep = 1 * magnitude;
  else if (residual <= 3.5) niceStep = 2 * magnitude;
  else if (residual <= 7.5) niceStep = 5 * magnitude;
  else niceStep = 10 * magnitude;

  const start = Math.ceil(min / niceStep) * niceStep;
  const result: number[] = [];
  for (let v = start; v <= max; v += niceStep) {
    result.push(v);
  }
  return result;
}

/* ── Side Panel Metrics ──────────────────────────────────────── */

interface SideMetric {
  metric: string;
  value: string;
  valueClass?: string;
  rsiValue?: number;
}

function computeSideMetrics(
  candles: CandleOHLC[],
  spot: number,
): SideMetric[] {
  if (candles.length === 0) return [];

  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);

  let rsi = 50;
  if (closes.length >= 15) {
    const changes = closes
      .slice(-15)
      .map((c, i, arr) => (i === 0 ? 0 : c - arr[i - 1]));
    changes.shift();
    const gains =
      changes.filter((d) => d > 0).reduce((a, b) => a + b, 0) / 14;
    const losses =
      Math.abs(
        changes.filter((d) => d < 0).reduce((a, b) => a + b, 0),
      ) / 14;
    rsi = losses === 0 ? 100 : 100 - 100 / (1 + gains / losses);
  }

  let atr = 0;
  if (candles.length >= 15) {
    const trs = candles.slice(-14).map((c, i, arr) => {
      const prev = i === 0 ? c : arr[i - 1];
      return Math.max(
        c.high - c.low,
        Math.abs(c.high - prev.close),
        Math.abs(c.low - prev.close),
      );
    });
    atr = trs.reduce((a, b) => a + b, 0) / trs.length;
  }

  const sma5 = closes.slice(-5).reduce((a, b) => a + b, 0) / 5;
  const sma20 =
    closes.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, closes.length);
  const trend =
    sma5 > sma20 ? "Bullish" : sma5 < sma20 ? "Bearish" : "Neutral";

  const recentHigh = Math.max(...highs.slice(-20));
  const recentLow = Math.min(...lows.slice(-20));

  const signal =
    rsi < 30 ? "BUY" : rsi > 70 ? "SELL" : trend === "Bullish" ? "BUY" : "HOLD";
  const confidence = Math.min(95, Math.round(50 + Math.abs(rsi - 50) * 1.2));

  return [
    {
      metric: "AI Signal",
      value: signal,
      valueClass:
        signal === "BUY"
          ? "text-[var(--green)]"
          : signal === "SELL"
            ? "text-[var(--red)]"
            : "text-[var(--gold-bright)]",
    },
    { metric: "Confidence", value: `${confidence}%` },
    { metric: "RSI (14)", value: rsi.toFixed(1), rsiValue: rsi },
    { metric: "ATR", value: atr.toFixed(1) },
    {
      metric: "Trend",
      value: trend,
      valueClass:
        trend === "Bullish"
          ? "text-[var(--green)]"
          : trend === "Bearish"
            ? "text-[var(--red)]"
            : "text-[var(--gold-bright)]",
    },
    {
      metric: "S / R",
      value: `${recentLow.toFixed(0)} / ${recentHigh.toFixed(0)}`,
    },
  ];
}

/* ── Sub-components ──────────────────────────────────────────── */

function GridLines({ min, max }: { min: number; max: number }) {
  const lines = useMemo(() => niceGridLines(min, max), [min, max]);

  return (
    <>
      {lines.map((price) => {
        const y = priceToY(price, min, max);
        return (
          <g key={price}>
            <line
              x1={PAD_L}
              y1={y}
              x2={CHART_W - PAD_R}
              y2={y}
              stroke="var(--bg-border)"
              strokeWidth={0.5}
              strokeDasharray="3 4"
              opacity={0.6}
            />
            <text
              x={PAD_L - 8}
              y={y + 3.5}
              textAnchor="end"
              fill="var(--text-muted)"
              fontSize="10"
              fontFamily="'JetBrains Mono', monospace"
            >
              {price.toFixed(1)}
            </text>
          </g>
        );
      })}
    </>
  );
}

function CandleStick({
  candle,
  index,
  total,
  min,
  max,
}: {
  candle: CandleOHLC;
  index: number;
  total: number;
  min: number;
  max: number;
}) {
  const bodyW = Math.max((PLOT_W - 2 * (total - 1)) / total, 2.5);
  const gap = (PLOT_W - bodyW * total) / (total - 1);
  const x = PAD_L + index * (bodyW + gap);

  const openY = priceToY(candle.open, min, max);
  const closeY = priceToY(candle.close, min, max);
  const highY = priceToY(candle.high, min, max);
  const lowY = priceToY(candle.low, min, max);

  const isBullish = candle.close >= candle.open;
  const bodyTop = isBullish ? closeY : openY;
  const bodyH = Math.max(Math.abs(closeY - openY), 1);

  const fill = isBullish ? "var(--green)" : "var(--red)";
  const stroke = isBullish
    ? "rgba(59,168,126,0.8)"
    : "rgba(232,72,59,0.8)";

  return (
    <g>
      <line
        x1={x + bodyW / 2}
        y1={highY}
        x2={x + bodyW / 2}
        y2={lowY}
        stroke={stroke}
        strokeWidth={1}
        opacity={0.85}
      />
      <rect
        x={x}
        y={bodyTop}
        width={bodyW}
        height={bodyH}
        fill={fill}
        stroke={stroke}
        strokeWidth={0.5}
        rx={1}
        opacity={0.92}
      />
    </g>
  );
}

function VolumeBars({
  volumes,
  maxVolume,
}: {
  volumes: VolumeBar[];
  maxVolume: number;
}) {
  if (volumes.length === 0) return null;

  const barW = Math.max((PLOT_W - 2 * (volumes.length - 1)) / volumes.length, 1);
  const gap = (PLOT_W - barW * volumes.length) / (volumes.length - 1);

  return (
    <>
      {volumes.map((v, i) => {
        const x = PAD_L + i * (barW + gap);
        const barH = Math.max(
          1,
          (v.value / maxVolume) * VOLUME_PLOT_H,
        );
        const y = VOLUME_H - VOLUME_PAD_B - barH;
        const fill = v.bullish
          ? "rgba(59,168,126,0.45)"
          : "rgba(232,72,59,0.4)";

        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barW}
            height={barH}
            fill={fill}
            rx={0.5}
          />
        );
      })}
    </>
  );
}

function MALine({
  data,
  min,
  max,
  color,
  dashArray,
}: {
  data: (number | null)[];
  min: number;
  max: number;
  color: string;
  dashArray?: string;
}) {
  const bodyW = Math.max((PLOT_W - 2 * (data.length - 1)) / data.length, 2.5);
  const gap = (PLOT_W - bodyW * data.length) / (data.length - 1);

  const points = data
    .map((v, i) => {
      if (v === null) return null;
      const x = PAD_L + i * (bodyW + gap) + bodyW / 2;
      const y = priceToY(v, min, max);
      return `${x},${y}`;
    })
    .filter(Boolean)
    .join(" ");

  if (!points) return null;

  return (
    <polyline
      points={points}
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={dashArray}
      opacity={0.85}
    />
  );
}

function TimeAxis({
  total,
  candles,
}: {
  total: number;
  candles: CandleOHLC[];
}) {
  const bodyW = Math.max((PLOT_W - 2 * (total - 1)) / total, 2.5);
  const gap = (PLOT_W - bodyW * total) / (total - 1);

  const labels: { x: number; label: string }[] = [];
  for (let i = 0; i < total; i++) {
    if (i % 5 === 0 || i === total - 1) {
      const x = PAD_L + i * (bodyW + gap) + bodyW / 2;
      const hour = (i * 4) % 24;
      const day = Math.floor(i / 6) + 1;
      const label =
        i === total - 1
          ? "Now"
          : i % 30 === 0
            ? `Jun ${day}`
            : `${hour.toString().padStart(2, "0")}:00`;
      labels.push({ x, label });
    }
  }

  return (
    <>
      {labels.map((l) => (
        <text
          key={l.label}
          x={l.x}
          y={CHART_H - 4}
          textAnchor="middle"
          fill="var(--text-muted)"
          fontSize="9"
          fontFamily="'JetBrains Mono', monospace"
        >
          {l.label}
        </text>
      ))}
    </>
  );
}

function CrosshairLine({
  crosshair,
  min,
  max,
  candles,
}: {
  crosshair: Crosshair;
  min: number;
  max: number;
  candles: CandleOHLC[];
}) {
  if (!crosshair.visible) return null;

  const y = priceToY(crosshair.price, min, max);
  const candle = candles[crosshair.index];
  if (!candle) return null;

  const isBullish = candle.close >= candle.open;
  const labelColor = isBullish ? "var(--green)" : "var(--red)";

  return (
    <g>
      {/* Vertical line */}
      <line
        x1={crosshair.x}
        y1={PAD_T}
        x2={crosshair.x}
        y2={CHART_H - PAD_B}
        stroke="var(--gold-primary)"
        strokeWidth={0.5}
        strokeDasharray="4 3"
        opacity={0.6}
      />

      {/* Horizontal line */}
      <line
        x1={PAD_L}
        y1={y}
        x2={CHART_W - PAD_R}
        y2={y}
        stroke="var(--gold-primary)"
        strokeWidth={0.5}
        strokeDasharray="2 3"
        opacity={0.4}
      />

      {/* Price label on right */}
      <rect
        x={CHART_W - PAD_R - 62}
        y={y - 10}
        width={58}
        height={20}
        rx={3}
        fill="var(--bg-card)"
        stroke="var(--border-gold)"
        strokeWidth={0.5}
      />
      <text
        x={CHART_W - PAD_R - 4}
        y={y + 4}
        textAnchor="end"
        fill={labelColor}
        fontSize="10"
        fontFamily="'JetBrains Mono', monospace"
        fontWeight={500}
      >
        {crosshair.price.toFixed(2)}
      </text>

      {/* Tooltip */}
      <rect
        x={Math.min(Math.max(crosshair.x - 70, PAD_L), CHART_W - PAD_R - 140)}
        y={PAD_T + 4}
        width={140}
        height={64}
        rx={4}
        fill="var(--bg-card)"
        stroke="var(--border-gold)"
        strokeWidth={0.5}
        opacity={0.95}
      />
      <text
        x={Math.min(Math.max(crosshair.x - 66, PAD_L + 4), CHART_W - PAD_R - 136)}
        y={PAD_T + 20}
        fill="var(--text-secondary)"
        fontSize="9"
        fontFamily="'JetBrains Mono', monospace"
      >
        O: {candle.open.toFixed(1)}
      </text>
      <text
        x={Math.min(Math.max(crosshair.x - 66, PAD_L + 4), CHART_W - PAD_R - 136)}
        y={PAD_T + 34}
        fill="var(--text-secondary)"
        fontSize="9"
        fontFamily="'JetBrains Mono', monospace"
      >
        H: {candle.high.toFixed(1)}
      </text>
      <text
        x={Math.min(Math.max(crosshair.x - 66, PAD_L + 4), CHART_W - PAD_R - 136)}
        y={PAD_T + 48}
        fill="var(--text-secondary)"
        fontSize="9"
        fontFamily="'JetBrains Mono', monospace"
      >
        L: {candle.low.toFixed(1)}
      </text>
      <text
        x={Math.min(Math.max(crosshair.x - 66, PAD_L + 4), CHART_W - PAD_R - 136)}
        y={PAD_T + 62}
        fill={labelColor}
        fontSize="9"
        fontFamily="'JetBrains Mono', monospace"
        fontWeight={500}
      >
        C: {candle.close.toFixed(1)}
      </text>
    </g>
  );
}

function SpotPriceLine({
  spot,
  min,
  max,
}: {
  spot: number;
  min: number;
  max: number;
}) {
  const y = priceToY(spot, min, max);

  return (
    <g>
      <line
        x1={PAD_L}
        y1={y}
        x2={CHART_W - PAD_R}
        y2={y}
        stroke="var(--gold-primary)"
        strokeWidth={1}
        strokeDasharray="5 3"
        opacity={0.55}
      />
      <rect
        x={PAD_L}
        y={y - 10}
        width={56}
        height={20}
        rx={3}
        fill="var(--bg-card)"
        stroke="var(--gold-primary)"
        strokeWidth={0.5}
        opacity={0.9}
      />
      <text
        x={PAD_L + 6}
        y={y + 4}
        fill="var(--gold-bright)"
        fontSize="10"
        fontFamily="'JetBrains Mono', monospace"
        fontWeight={500}
      >
        {spot.toFixed(1)}
      </text>
    </g>
  );
}

function RsiBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  const barColor =
    clamped > 70
      ? "var(--red)"
      : clamped < 30
        ? "var(--green)"
        : "var(--gold-primary)";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-border)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${clamped}%`,
            backgroundColor: barColor,
          }}
        />
      </div>
      <div className="flex gap-0.5">
        <div
          className="w-6 h-0.5 rounded-full"
          style={{
            backgroundColor:
              clamped < 30 ? "var(--green)" : "var(--bg-border)",
          }}
        />
        <div
          className="w-6 h-0.5 rounded-full"
          style={{
            backgroundColor:
              clamped >= 30 && clamped <= 70
                ? "var(--gold-primary)"
                : "var(--bg-border)",
          }}
        />
        <div
          className="w-6 h-0.5 rounded-full"
          style={{
            backgroundColor:
              clamped > 70 ? "var(--red)" : "var(--bg-border)",
          }}
        />
      </div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────── */

export function XauusdChart() {
  const [candles, setCandles] = useState<CandleOHLC[]>(fallbackCandles);
  const [spot, setSpot] = useState(fallbackSpot);
  const [source, setSource] = useState<"live" | "fallback">("fallback");
  const [error, setError] = useState(false);
  const [crosshair, setCrosshair] = useState<Crosshair>({
    x: 0,
    price: 0,
    index: 0,
    visible: false,
  });
  const [activeTf, setActiveTf] = useState("4H");
  const abortRef = useRef<AbortController | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const fetchChart = useCallback(async () => {
    try {
      const controller = new AbortController();
      abortRef.current?.abort();
      abortRef.current = controller;

      const res = await fetch("/api/xauusd", {
        signal: controller.signal,
        cache: "no-store",
      });

      if (!res.ok) throw new Error("API error");

      const json = await res.json();

      if (json.candles?.length > 0) {
        setCandles(json.candles);
        setSpot(json.spot);
        setSource(json.source === "twelve-data" ? "live" : "fallback");
        setError(false);
      }
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchChart();
    }, 0);
    const interval = setInterval(fetchChart, POLL_INTERVAL_MS);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
      abortRef.current?.abort();
    };
  }, [fetchChart]);

  const { min, max } = useMemo(() => computeBounds(candles), [candles]);

  const closes = useMemo(() => candles.map((c) => c.close), [candles]);
  const sma9 = useMemo(() => computeSMA(closes, 9), [closes]);
  const sma20 = useMemo(() => computeSMA(closes, 20), [closes]);

  const volumes = useMemo(
    () =>
      candles.map((c, i): VolumeBar => ({
        value: generateVolume(c, i),
        bullish: c.close >= c.open,
      })),
    [candles],
  );

  const maxVolume = useMemo(
    () => Math.max(...volumes.map((v) => v.value), 1),
    [volumes],
  );

  const firstOpen = candles[0]?.open ?? spot;
  const priceChange = spot - firstOpen;
  const priceChangePct =
    firstOpen !== 0 ? ((priceChange / firstOpen) * 100).toFixed(2) : "0.00";
  const changeSign = priceChange >= 0 ? "+" : "";

  const sideMetrics = useMemo(
    () => computeSideMetrics(candles, spot),
    [candles, spot],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      const scaleX = CHART_W / rect.width;
      const scaleY = CHART_H / rect.height;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;

      if (mouseX < PAD_L || mouseX > CHART_W - PAD_R) {
        setCrosshair((prev) => ({ ...prev, visible: false }));
        return;
      }

      const bodyW = Math.max(
        (PLOT_W - 2 * (candles.length - 1)) / candles.length,
        2.5,
      );
      const gap =
        (PLOT_W - bodyW * candles.length) / (candles.length - 1);
      const idx = Math.min(
        Math.max(
          0,
          Math.round((mouseX - PAD_L) / (bodyW + gap)),
        ),
        candles.length - 1,
      );

      const candle = candles[idx];
      const priceAtY =
        max - ((mouseY - PAD_T) / PLOT_H) * (max - min);

      setCrosshair({
        x: mouseX,
        price: Math.max(min, Math.min(max, priceAtY)),
        index: idx,
        visible: true,
      });
    },
    [candles, min, max],
  );

  const handleMouseLeave = useCallback(() => {
    setCrosshair((prev) => ({ ...prev, visible: false }));
  }, []);

  const timeframes = ["1H", "4H", "1D", "1W"];

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-2xl overflow-hidden shadow-[0_32px_64px_rgba(0,0,0,0.35)]">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--bg-border)] bg-[var(--bg-card)]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--red)]/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--gold-bright)]/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--green)]/70" />
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] font-mono tracking-[0.03em]">
            Dralvo
          </span>
          <span className="text-[11px] text-[var(--text-muted)] font-mono">
            ·
          </span>
          <span className="text-[11px] text-[var(--gold-bright)] font-mono font-medium tracking-[0.03em]">
            XAUUSD
          </span>
          <span className="text-[11px] text-[var(--text-muted)] font-mono">
            ·
          </span>
          <span className="text-[11px] text-[var(--text-secondary)] font-mono">
            {activeTf}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Timeframe pills */}
          <div className="flex items-center gap-1 bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg p-0.5">
            {timeframes.map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setActiveTf(tf)}
                className={cn(
                  "text-[10px] font-mono px-2.5 py-1 rounded-md transition-all duration-200",
                  activeTf === tf
                    ? "bg-[var(--gold-ghost)] text-[var(--gold-bright)] border border-[var(--border-gold)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
                )}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Live / Demo indicator */}
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span
                className={cn(
                  "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                  source === "live"
                    ? "bg-[var(--green)]"
                    : "bg-[var(--gold-bright)]",
                )}
              />
              <span
                className={cn(
                  "relative inline-flex rounded-full h-2 w-2",
                  source === "live"
                    ? "bg-[var(--green)]"
                    : "bg-[var(--gold-bright)]",
                )}
              />
            </span>
            <span
              className={cn(
                "text-[10px] font-mono font-medium",
                source === "live"
                  ? "text-[var(--green)]"
                  : "text-[var(--gold-bright)]",
              )}
            >
              {source === "live" ? "LIVE" : "DEMO"}
            </span>
            {error && (
              <span className="text-[10px] text-[var(--red)] font-mono ml-0.5">
                !
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Body Grid ── */}
      <div className="grid grid-cols-[1fr_210px] min-h-[440px] max-md:grid-cols-1">
        {/* ── Main Chart Area ── */}
        <div className="p-5 flex flex-col border-r border-[var(--bg-border)] max-md:border-r-0 max-md:border-b">
          {/* Price header */}
          <div className="flex items-baseline gap-3 mb-3 pl-[60px]">
            <span className="font-mono text-2xl font-semibold text-[var(--text-primary)] tracking-[-0.02em]">
              {spot.toFixed(2)}
            </span>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              USD
            </span>
            <span
              className={cn(
                "text-xs font-mono font-medium ml-1",
                priceChange >= 0
                  ? "text-[var(--green)]"
                  : "text-[var(--red)]",
              )}
            >
              {changeSign}
              {priceChange.toFixed(2)} ({changeSign}
              {priceChangePct}%)
            </span>
          </div>

          {/* Candlestick chart */}
          <svg
            ref={svgRef}
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            className="w-full h-auto"
            preserveAspectRatio="xMidYMid meet"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <GridLines min={min} max={max} />

            {candles.map((candle, i) => (
              <CandleStick
                key={i}
                candle={candle}
                index={i}
                total={candles.length}
                min={min}
                max={max}
              />
            ))}

            <MALine
              data={sma9}
              min={min}
              max={max}
              color="var(--gold-bright)"
            />
            <MALine
              data={sma20}
              min={min}
              max={max}
              color="rgba(148,163,184,0.7)"
              dashArray="4 2"
            />

            <SpotPriceLine spot={spot} min={min} max={max} />
            <TimeAxis total={candles.length} candles={candles} />
            <CrosshairLine
              crosshair={crosshair}
              min={min}
              max={max}
              candles={candles}
            />
          </svg>

          {/* MA legend */}
          <div className="flex items-center gap-4 mt-1 pl-[60px]">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded-full bg-[var(--gold-bright)]" />
              <span className="text-[9px] text-[var(--text-muted)] font-mono">
                SMA 9
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded-full bg-[rgba(148,163,184,0.7)]" />
              <span className="text-[9px] text-[var(--text-muted)] font-mono">
                SMA 20
              </span>
            </div>
          </div>

          {/* Volume chart */}
          <div className="mt-3">
            <div className="flex items-center gap-2 mb-1 pl-[60px]">
              <span className="text-[9px] text-[var(--text-muted)] font-mono uppercase tracking-[0.05em]">
                Volume
              </span>
            </div>
            <svg
              viewBox={`0 0 ${CHART_W} ${VOLUME_H}`}
              className="w-full h-auto max-h-[60px]"
              preserveAspectRatio="xMidYMid meet"
            >
              <VolumeBars volumes={volumes} maxVolume={maxVolume} />
            </svg>
          </div>

          {/* Footer info */}
          <span className="font-mono text-[10px] text-[var(--text-muted)] mt-2 pl-[60px]">
            {activeTf} Timeframe · {candles.length} candles ·{" "}
            {candles.length * 4}h span
            {source === "live" ? " · Twelve Data" : " · Mock data"}
          </span>
        </div>

        {/* ── Side Panel ── */}
        <div className="p-4 flex flex-col gap-0 bg-[var(--bg-card)]">
          <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-[0.06em] mb-2 px-1">
            Indicators
          </span>

          {sideMetrics.map((item) => (
            <div
              key={item.metric}
              className="flex flex-col py-2.5 px-1 border-b border-[var(--bg-border)] last:border-b-0 gap-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-[0.03em]">
                  {item.metric}
                </span>
                <span
                  className={cn(
                    "font-mono text-[12px] font-medium",
                    item.valueClass || "text-[var(--text-primary)]",
                  )}
                >
                  {item.value}
                </span>
              </div>

              {item.rsiValue !== undefined && (
                <RsiBar value={item.rsiValue} />
              )}
            </div>
          ))}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Mini summary footer */}
          <div className="mt-2 pt-3 border-t border-[var(--bg-border)]">
            <div className="flex items-center justify-between text-[9px] font-mono">
              <span className="text-[var(--text-muted)]">24H Range</span>
              <span className="text-[var(--text-secondary)]">
                {Math.min(...candles.map((c) => c.low)).toFixed(1)} —{" "}
                {Math.max(...candles.map((c) => c.high)).toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
