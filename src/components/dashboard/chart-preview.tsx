"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { dashboardCandles as fallbackCandles, XAUUSD_SPOT as fallbackSpot, type CandleOHLC } from "@/data/indicators";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 60_000; // 1 minute

/* ── Side panel metrics ──────────────────────────────────────── */

function computeSideMetrics(candles: CandleOHLC[], spot: number) {
  if (candles.length === 0) return [];

  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);

  // RSI 14
  let rsi = 50;
  if (closes.length >= 15) {
    const changes = closes.slice(-15).map((c, i, arr) => (i === 0 ? 0 : c - arr[i - 1]));
    changes.shift();
    const gains = changes.filter((d) => d > 0).reduce((a, b) => a + b, 0) / 14;
    const losses = Math.abs(changes.filter((d) => d < 0).reduce((a, b) => a + b, 0)) / 14;
    rsi = losses === 0 ? 100 : 100 - 100 / (1 + gains / losses);
  }

  // ATR 14
  let atr = 0;
  if (candles.length >= 15) {
    const trs = candles.slice(-14).map((c, i, arr) => {
      const prev = i === 0 ? c : arr[i - 1];
      return Math.max(c.high - c.low, Math.abs(c.high - prev.close), Math.abs(c.low - prev.close));
    });
    atr = trs.reduce((a, b) => a + b, 0) / trs.length;
  }

  // Trend
  const sma5 = closes.slice(-5).reduce((a, b) => a + b, 0) / 5;
  const sma20 = closes.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, closes.length);
  const trend = sma5 > sma20 ? "Bullish" : sma5 < sma20 ? "Bearish" : "Neutral";

  // Support / Resistance
  const recentHigh = Math.max(...highs.slice(-20));
  const recentLow = Math.min(...lows.slice(-20));

  // AI Signal (simple heuristic)
  const signal = rsi < 30 ? "BUY" : rsi > 70 ? "SELL" : trend === "Bullish" ? "BUY" : "HOLD";
  const confidence = Math.min(95, Math.round(50 + Math.abs(rsi - 50) * 1.2));

  return [
    { metric: "AI Signal", value: signal, valueClass: signal === "BUY" ? "text-green" : signal === "SELL" ? "text-red" : "text-gold-bright" },
    { metric: "Confidence", value: `${confidence}%` },
    { metric: "RSI (14)", value: rsi.toFixed(1) },
    { metric: "ATR", value: atr.toFixed(1) },
    { metric: "Trend", value: trend, valueClass: trend === "Bullish" ? "text-green" : trend === "Bearish" ? "text-red" : "text-gold-bright" },
    { metric: "S / R", value: `${recentLow.toFixed(0)} / ${recentHigh.toFixed(0)}` },
  ];
}

/* ── SVG Candlestick Chart ───────────────────────────────────── */

const CHART_W = 620;
const CHART_H = 200;
const PAD_L = 52;
const PAD_R = 12;
const PAD_T = 14;
const PAD_B = 22;
const PLOT_W = CHART_W - PAD_L - PAD_R;
const PLOT_H = CHART_H - PAD_T - PAD_B;

const CANDLE_GAP = 3;
const WICK_W = 1;

function computeBounds(candles: CandleOHLC[]) {
  let min = Infinity;
  let max = -Infinity;
  for (const c of candles) {
    if (c.low < min) min = c.low;
    if (c.high > max) max = c.high;
  }
  const pad = (max - min) * 0.003;
  return { min: min - pad, max: max + pad };
}

function priceToY(price: number, min: number, max: number) {
  return PAD_T + PLOT_H * (1 - (price - min) / (max - min));
}

function CandleSVG({
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
  const bodyW = Math.max((PLOT_W - CANDLE_GAP * (total - 1)) / total, 2);
  const x = PAD_L + index * (bodyW + CANDLE_GAP);

  const openY = priceToY(candle.open, min, max);
  const closeY = priceToY(candle.close, min, max);
  const highY = priceToY(candle.high, min, max);
  const lowY = priceToY(candle.low, min, max);

  const isBullish = candle.close >= candle.open;
  const bodyTop = isBullish ? closeY : openY;
  const bodyH = Math.max(Math.abs(closeY - openY), 1);

  const fill = isBullish ? "#22c55e" : "#ef4444";
  const stroke = isBullish ? "#16a34a" : "#dc2626";

  return (
    <g key={index}>
      <line x1={x + bodyW / 2} y1={highY} x2={x + bodyW / 2} y2={lowY} stroke={stroke} strokeWidth={WICK_W} opacity={0.85} />
      <rect x={x} y={bodyTop} width={bodyW} height={bodyH} fill={fill} stroke={stroke} strokeWidth={0.5} rx={1} opacity={0.9} />
    </g>
  );
}

function GridLines({ min, max }: { min: number; max: number }) {
  const lines = useMemo(() => {
    const range = max - min;
    const rawStep = range / 5;
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
  }, [min, max]);

  return (
    <>
      {lines.map((price) => {
        const y = priceToY(price, min, max);
        return (
          <g key={price}>
            <line x1={PAD_L} y1={y} x2={CHART_W - PAD_R} y2={y} stroke="rgba(212,168,67,0.12)" strokeWidth={0.5} />
            <text x={PAD_L - 6} y={y + 3.5} textAnchor="end" fill="rgba(148,163,184,0.7)" fontSize="9" fontFamily="'JetBrains Mono', 'Fira Code', monospace">
              {price.toFixed(1)}
            </text>
          </g>
        );
      })}
    </>
  );
}

/* ── Component ───────────────────────────────────────────────── */

export function ChartPreview() {
  const [candles, setCandles] = useState<CandleOHLC[]>(fallbackCandles);
  const [spot, setSpot] = useState(fallbackSpot);
  const [source, setSource] = useState<"live" | "fallback">("fallback");
  const [error, setError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

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
  const firstOpen = candles[0]?.open ?? spot;
  const priceChange = spot - firstOpen;
  const priceChangePct = firstOpen !== 0 ? ((priceChange / firstOpen) * 100).toFixed(2) : "0.00";
  const changeSign = priceChange >= 0 ? "+" : "";

  const sideMetrics = useMemo(() => computeSideMetrics(candles, spot), [candles, spot]);

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-[0_32px_64px_rgba(0,0,0,0.35)]">
      {/* Topbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-gold-bright/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-green/70" />
          </div>
          <span className="text-[11px] text-text-secondary font-mono tracking-[0.03em]">
            Dralvo · XAUUSD · 4H
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span
              className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                source === "live" ? "bg-green" : "bg-gold-bright",
              )}
            />
            <span
              className={cn(
                "relative inline-flex rounded-full h-2 w-2",
                source === "live" ? "bg-green" : "bg-gold-bright",
              )}
            />
          </span>
          <span
            className={cn(
              "text-[11px] font-mono",
              source === "live" ? "text-green" : "text-gold-bright",
            )}
          >
            {source === "live" ? "LIVE" : "DEMO"}
          </span>
          {error && (
            <span className="text-[10px] text-red font-mono ml-1">!</span>
          )}
        </div>
      </div>

      {/* Dashboard grid */}
      <div className="grid grid-cols-[1fr_200px] min-h-[360px] max-md:grid-cols-1">
        {/* Main chart */}
        <div className="p-6 flex flex-col items-center justify-center border-r border-border max-md:border-r-0 max-md:border-b">
          <div className="w-full flex items-baseline gap-3 mb-4 pl-[52px]">
            <span className="font-display text-2xl tracking-[-0.01em] text-text-primary">
              {spot.toFixed(2)}
            </span>
            <span className="text-xs text-text-muted font-mono">USD</span>
            <span
              className={cn(
                "text-xs font-mono font-medium ml-1",
                priceChange >= 0 ? "text-green" : "text-red",
              )}
            >
              {changeSign}
              {priceChange.toFixed(2)} ({changeSign}
              {priceChangePct}%)
            </span>
          </div>

          <svg
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            className="w-full h-auto max-h-[220px]"
            preserveAspectRatio="xMidYMid meet"
          >
            <GridLines min={min} max={max} />
            {candles.map((candle, i) => (
              <CandleSVG key={i} candle={candle} index={i} total={candles.length} min={min} max={max} />
            ))}
            <line
              x1={PAD_L}
              y1={priceToY(spot, min, max)}
              x2={CHART_W - PAD_R}
              y2={priceToY(spot, min, max)}
              stroke="rgba(212,168,67,0.5)"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
            <text
              x={CHART_W - PAD_R - 2}
              y={priceToY(spot, min, max) - 5}
              textAnchor="end"
              fill="rgba(212,168,67,0.9)"
              fontSize="9"
              fontFamily="'JetBrains Mono', 'Fira Code', monospace"
            >
              {spot.toFixed(1)}
            </text>
          </svg>

          <span className="font-mono text-[11px] text-text-muted block mt-3">
            4H Timeframe · {candles.length} candles · {candles.length * 4}h span
            {source === "live" ? " · Twelve Data" : " · Mock data"}
          </span>
        </div>

        {/* Side panel */}
        <div className="p-5 flex flex-col gap-px bg-card">
          {sideMetrics.map((item) => (
            <div
              key={item.metric}
              className="flex items-center justify-between py-3 px-2 border-b border-border last:border-b-0"
            >
              <span className="font-mono text-[11px] text-text-muted uppercase tracking-[0.03em]">
                {item.metric}
              </span>
              <span
                className={cn(
                  "font-mono text-[13px] font-medium",
                  item.valueClass || "text-text-primary",
                )}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
