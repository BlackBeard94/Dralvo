"use client";

import { Activity, Clock3, TrendingDown, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { CandleOHLC } from "@/data/indicators";
import { cn } from "@/lib/utils";

type XauusdResponse = {
  ok: boolean;
  source: string;
  spot?: number;
  candles?: CandleOHLC[];
  error?: string;
};

const POLL_INTERVAL_MS = 60_000;

function formatPrice(value: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function currentSession(hour: number) {
  if (hour >= 13 && hour < 17) return "London / New York overlap";
  if (hour >= 13 && hour < 22) return "New York";
  if (hour >= 8 && hour < 17) return "London";
  if (hour < 9) return "Asia";
  return "Inter-session";
}

export function MarketHeader() {
  const [candles, setCandles] = useState<CandleOHLC[]>([]);
  const [spot, setSpot] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/xauusd", {
        cache: "no-store",
        signal: controller.signal,
      });
      const data = (await response.json()) as XauusdResponse;
      if (!response.ok || !data.ok || !data.spot || !data.candles?.length) {
        throw new Error(data.error ?? `HTTP ${response.status}`);
      }

      setCandles(data.candles);
      setSpot(data.spot);
    } catch {
      // Keep the last good data on screen; the server already falls back to a
      // cached quote and never returns raw provider errors to expose here.
      if (controller.signal.aborted) return;
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
    const interval = window.setInterval(fetchData, POLL_INTERVAL_MS);
    return () => {
      window.clearInterval(interval);
      abortRef.current?.abort();
    };
  }, [fetchData]);

  const stats = useMemo(() => {
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

  const session = currentSession(new Date().getUTCHours());

  if (spot === null || !stats) {
    return (
      <div className="card-elevate flex min-h-20 items-center justify-between gap-4 rounded-xl border border-border bg-surface px-5 py-4 h-full">
        <div>
          <p className="text-[12px] uppercase tracking-[0.16em] text-text-muted">
            XAUUSD market context
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            {loading ? "Loading verified market data..." : "Market data is updating — check back shortly."}
          </p>
        </div>
        {!loading && (
          <span className="flex items-center gap-2 text-xs text-text-muted">
            <span className="h-2 w-2 rounded-full bg-gold animate-pulse" />
            Refreshing
          </span>
        )}
      </div>
    );
  }

  const positive = stats.change >= 0;
  const ChangeIcon = positive ? TrendingUp : TrendingDown;

  return (
    <div className="card-elevate flex flex-wrap items-center gap-x-8 gap-y-4 rounded-xl border border-border bg-surface px-5 py-4 h-full">
      <div>
        <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] text-text-muted">
          <span className="h-2 w-2 rounded-full bg-green" />
          Twelve Data · 4H bars
        </div>
        <div className="mt-1 flex items-baseline gap-3">
          <span className="font-display text-3xl text-text-primary">
            ${formatPrice(spot)}
          </span>
          <span
            className={cn(
              "flex items-center gap-1 text-xs font-mono",
              positive ? "text-green" : "text-red",
            )}
          >
            <ChangeIcon className="h-3.5 w-3.5" />
            {positive ? "+" : ""}
            {stats.changePercent.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6 text-xs">
        <div>
          <p className="text-[12px] uppercase tracking-wider text-text-muted">
            Loaded range high
          </p>
          <p className="mt-1 font-mono text-text-primary">
            ${formatPrice(stats.high)}
          </p>
        </div>
        <div>
          <p className="text-[12px] uppercase tracking-wider text-text-muted">
            Loaded range low
          </p>
          <p className="mt-1 font-mono text-text-primary">
            ${formatPrice(stats.low)}
          </p>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-5 text-xs text-text-muted">
        <span className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-gold" />
          {session}
        </span>
        <span className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-green" />
          Verified source
        </span>
      </div>
    </div>
  );
}
