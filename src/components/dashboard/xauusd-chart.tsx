"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { CandleOHLC } from "@/data/indicators";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 60_000;
const WIDTH = 960;
const HEIGHT = 420;
const PAD = { top: 24, right: 28, bottom: 34, left: 70 };

type ChartResponse = {
  ok: boolean;
  source: string;
  spot?: number;
  candles?: CandleOHLC[];
  error?: string;
};

function chartBounds(candles: CandleOHLC[]) {
  const low = Math.min(...candles.map((candle) => candle.low));
  const high = Math.max(...candles.map((candle) => candle.high));
  const padding = Math.max((high - low) * 0.08, 1);
  return { min: low - padding, max: high + padding };
}

function priceY(price: number, min: number, max: number) {
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  return PAD.top + ((max - price) / (max - min)) * plotHeight;
}

function gridPrices(min: number, max: number) {
  return Array.from({ length: 6 }, (_, index) => min + ((max - min) * index) / 5);
}

export function XauusdChart() {
  const [candles, setCandles] = useState<CandleOHLC[]>([]);
  const [spot, setSpot] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  const fetchChart = useCallback(async () => {
    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;
    setLoading(true);

    try {
      const response = await fetch("/api/xauusd", {
        cache: "no-store",
        signal: controller.signal,
      });
      const data = (await response.json()) as ChartResponse;
      if (!response.ok || !data.ok || !data.candles?.length || !data.spot) {
        throw new Error(data.error ?? `HTTP ${response.status}`);
      }

      setCandles(data.candles);
      setSpot(data.spot);
      setError(null);
    } catch (fetchError) {
      if (controller.signal.aborted) return;
      setError(
        fetchError instanceof Error ? fetchError.message : "Data unavailable",
      );
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchChart();
    const interval = window.setInterval(fetchChart, POLL_INTERVAL_MS);
    return () => {
      window.clearInterval(interval);
      abortRef.current?.abort();
    };
  }, [fetchChart]);

  const bounds = useMemo(
    () => (candles.length ? chartBounds(candles) : null),
    [candles],
  );
  const summary = useMemo(() => {
    if (!candles.length || spot === null) return null;
    const start = candles[0].open;
    const change = spot - start;
    return {
      change,
      changePercent: start > 0 ? (change / start) * 100 : 0,
      high: Math.max(...candles.map((candle) => candle.high)),
      low: Math.min(...candles.map((candle) => candle.low)),
    };
  }, [candles, spot]);

  if (!bounds || !summary || spot === null) {
    return (
      <div className="flex min-h-[440px] items-center justify-center rounded-2xl border border-border bg-surface p-8 text-center">
        <div className="max-w-md">
          <AlertCircle className="mx-auto h-8 w-8 text-gold" />
          <h2 className="mt-4 font-display text-xl text-text-primary">
            {loading ? "Loading verified XAUUSD bars" : "Chart data unavailable"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-text-muted">
            Dralvo does not display simulated candles when Twelve Data cannot
            provide the requested series.
          </p>
          {error && <p className="mt-3 font-mono text-xs text-red">{error}</p>}
          <button
            type="button"
            onClick={() => void fetchChart()}
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-border-gold px-4 py-2 text-xs text-gold hover:bg-gold/10"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const plotWidth = WIDTH - PAD.left - PAD.right;
  const candleSlot = plotWidth / candles.length;
  const candleWidth = Math.max(3, candleSlot * 0.56);
  const positive = summary.change >= 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_28px_70px_rgba(0,0,0,0.22)]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-card px-5 py-4">
        <div>
          <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] text-text-muted">
            <span className="h-2 w-2 rounded-full bg-green" />
            XAUUSD · Twelve Data · 4H
          </div>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="font-display text-3xl text-text-primary">
              ${spot.toFixed(2)}
            </span>
            <span
              className={cn(
                "font-mono text-xs",
                positive ? "text-green" : "text-red",
              )}
            >
              {positive ? "+" : ""}
              {summary.change.toFixed(2)} ({positive ? "+" : ""}
              {summary.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        <div className="flex gap-6 text-xs">
          <div>
            <p className="text-[12px] uppercase tracking-wider text-text-muted">
              Loaded high
            </p>
            <p className="mt-1 font-mono text-text-primary">
              ${summary.high.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-[12px] uppercase tracking-wider text-text-muted">
              Loaded low
            </p>
            <p className="mt-1 font-mono text-text-primary">
              ${summary.low.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-auto w-full"
          role="img"
          aria-label="Verified XAUUSD four-hour candlestick chart"
        >
          {gridPrices(bounds.min, bounds.max).map((price) => {
            const y = priceY(price, bounds.min, bounds.max);
            return (
              <g key={price}>
                <line
                  x1={PAD.left}
                  x2={WIDTH - PAD.right}
                  y1={y}
                  y2={y}
                  stroke="var(--bg-border)"
                  strokeDasharray="4 5"
                />
                <text
                  x={PAD.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill="var(--text-muted)"
                  fontSize="13.75"
                  fontFamily="monospace"
                >
                  {price.toFixed(0)}
                </text>
              </g>
            );
          })}

          {candles.map((candle, index) => {
            const x = PAD.left + index * candleSlot + candleSlot / 2;
            const openY = priceY(candle.open, bounds.min, bounds.max);
            const closeY = priceY(candle.close, bounds.min, bounds.max);
            const highY = priceY(candle.high, bounds.min, bounds.max);
            const lowY = priceY(candle.low, bounds.min, bounds.max);
            const bullish = candle.close >= candle.open;
            const color = bullish ? "var(--green)" : "var(--red)";

            return (
              <g key={`${index}-${candle.open}-${candle.close}`}>
                <line
                  x1={x}
                  x2={x}
                  y1={highY}
                  y2={lowY}
                  stroke={color}
                  strokeWidth="1.4"
                />
                <rect
                  x={x - candleWidth / 2}
                  y={Math.min(openY, closeY)}
                  width={candleWidth}
                  height={Math.max(Math.abs(openY - closeY), 1.5)}
                  rx="1"
                  fill={color}
                  opacity="0.9"
                />
              </g>
            );
          })}

          <line
            x1={PAD.left}
            x2={WIDTH - PAD.right}
            y1={priceY(spot, bounds.min, bounds.max)}
            y2={priceY(spot, bounds.min, bounds.max)}
            stroke="var(--gold-bright)"
            strokeDasharray="6 4"
          />
        </svg>

        <p className="mt-2 text-center font-mono text-[12px] text-text-muted">
          {candles.length} verified 4H candles · no synthetic volume · no
          simulated fallback
        </p>
      </div>
    </div>
  );
}
