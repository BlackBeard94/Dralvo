"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Lock } from "lucide-react";

import { useLocale } from "@/hooks/use-locale";
import { DASHBOARD_COPY } from "@/lib/i18n";

type HistoryResponse = {
  points: { observedAt: string; value: number }[];
  summary: {
    latest: { observedAt: string; value: number } | null;
    change: number | null;
    percentile: number | null;
    minimum: number | null;
    maximum: number | null;
  };
  limited: boolean;
};

type HistoryVariant = "cftc" | "gld" | "tips" | "xauusd";

function linePath(points: { value: number }[], width = 620, height = 150) {
  if (points.length < 2) return "";
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((point.value - min) / range) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export function DriverHistoryPanel({
  driverKey,
  variant,
}: {
  driverKey:
    | "cftc-gold-positioning"
    | "gld-gold-holdings"
    | "tips-real-yield"
    | "xauusd-price-context";
  variant: HistoryVariant;
}) {
  const { locale } = useLocale();
  const copy = DASHBOARD_COPY[locale].drivers;
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/drivers/history?driver=${driverKey}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return (await response.json()) as HistoryResponse;
      })
      .then(setHistory)
      .catch((fetchError) => {
        if (fetchError instanceof Error && fetchError.name === "AbortError") return;
        setError(true);
      });
    return () => controller.abort();
  }, [driverKey]);

  const path = useMemo(() => linePath(history?.points ?? []), [history]);
  const isGld = variant === "gld";
  const isTips = variant === "tips";
  const isXauusd = variant === "xauusd";
  const gradientId = `${variant}HistoryFill`;
  if (error) return null;

  return (
    <div className="mt-5 overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <p className="text-[13px] uppercase tracking-[0.16em] text-gold">
            {isGld
              ? copy.holdingsHistory
              : isTips
                ? copy.realYieldHistory
                : isXauusd
                  ? copy.priceHistory
                : copy.history}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            {isGld
              ? copy.gldTonnes
              : isTips
                ? copy.tipsPercent
                : isXauusd
                  ? copy.xauusdClose
                : copy.managedMoneyNet}
          </p>
        </div>
        {history?.summary.percentile !== null && history?.summary.percentile !== undefined && (
          <div className="text-right">
            <p className="font-mono text-lg text-text-primary">
              P{history.summary.percentile}
            </p>
            <p className="text-[13px] uppercase tracking-wider text-text-muted">
              {copy.percentile}
            </p>
          </div>
        )}
      </div>

      <div className="p-4">
        {!history ? (
          <div className="h-[150px] animate-pulse rounded-lg bg-surface" />
        ) : history.points.length < 2 ? (
          <p className="py-12 text-center text-xs text-text-muted">
            {copy.noHistory}
          </p>
        ) : (
          <>
            <svg
              viewBox="0 0 620 150"
              role="img"
              aria-label={
                isGld
                  ? copy.gldChartLabel
                  : isTips
                    ? copy.tipsChartLabel
                    : isXauusd
                      ? copy.xauusdChartLabel
                    : copy.chartLabel
              }
              className="h-[150px] w-full overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--gold-primary)" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="var(--gold-primary)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={`${path} L 620 150 L 0 150 Z`}
                fill={`url(#${gradientId})`}
              />
              <path
                d={path}
                fill="none"
                stroke="var(--gold-primary)"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <div className="mt-3 grid grid-cols-3 gap-3 border-t border-border pt-3">
              <Metric
                label={copy.latest}
                value={history.summary.latest?.value}
                decimals={isGld || isTips || isXauusd ? 2 : 0}
              />
              <Metric
                label={
                  isGld
                    ? copy.dailyChange
                    : isTips
                      ? copy.dailyYieldChange
                      : isXauusd
                        ? copy.dailyPriceChange
                      : copy.weeklyChange
                }
                value={history.summary.change}
                signed
                decimals={isGld || isTips || isXauusd ? 2 : 0}
              />
              <Metric label={copy.observations} value={history.points.length} compact />
            </div>
          </>
        )}
      </div>

      {history?.limited && (
        <div className="flex items-center justify-between gap-3 border-t border-border bg-gold/[0.03] px-4 py-3">
          <p className="flex items-center gap-2 text-[12px] text-text-muted">
            <Lock className="h-3 w-3 text-gold" />
            {isGld
              ? copy.limitedGldHistory
              : isTips
                ? copy.limitedTipsHistory
                : isXauusd
                  ? copy.limitedXauusdHistory
                : copy.limitedHistory}
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-gold no-underline"
          >
            {copy.unlockHistory}
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  signed = false,
  compact = false,
  decimals = 0,
}: {
  label: string;
  value: number | null | undefined;
  signed?: boolean;
  compact?: boolean;
  decimals?: number;
}) {
  const formatted =
    value === null || value === undefined
      ? "-"
      : compact
        ? String(value)
        : `${signed && value > 0 ? "+" : ""}${value.toLocaleString("en-US", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })}`;
  return (
    <div>
      <p className="text-[13px] uppercase tracking-wider text-text-muted">{label}</p>
      <p className="mt-1 font-mono text-xs text-text-primary">{formatted}</p>
    </div>
  );
}
