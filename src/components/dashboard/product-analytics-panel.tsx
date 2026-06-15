"use client";

import { BarChart3, RefreshCw, Users } from "lucide-react";
import { useEffect, useState } from "react";

import type { ProductAnalyticsSummary } from "@/lib/product-analytics";
import { cn } from "@/lib/utils";

type AnalyticsResponse = {
  generated_at?: string;
  potentially_truncated?: boolean;
  summary?: ProductAnalyticsSummary;
  error?: string;
};

function formatRate(rate: number | null) {
  return rate === null
    ? "Not eligible yet"
    : new Intl.NumberFormat("en-US", {
        style: "percent",
        maximumFractionDigits: 1,
      }).format(rate);
}

export function ProductAnalyticsPanel() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/ops/product-analytics", {
        cache: "no-store",
      });
      const body = (await response.json()) as AnalyticsResponse;
      setData(response.ok ? body : { error: body.error ?? `HTTP ${response.status}` });
    } catch (error) {
      setData({
        error: error instanceof Error ? error.message : "Analytics unavailable",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (!loading && data?.error) return null;

  const summary = data?.summary;

  return (
    <section className="rounded-2xl border border-border bg-surface/60 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-gold" />
          <div>
            <h2 className="font-display text-lg text-text-primary">
              Product validation
            </h2>
            <p className="text-[12px] text-text-muted">
              First-party cohort and workflow analytics
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[13px] font-semibold text-text-secondary hover:border-border-gold hover:text-gold disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {!summary ? (
        <p className="text-sm text-text-muted">Loading validation metrics...</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric
              label="7-day active users"
              value={String(summary.activeUsers.current7Days)}
            />
            <Metric
              label="Previous 7 days"
              value={String(summary.activeUsers.previous7Days)}
            />
            <Metric
              label="Returning this week"
              value={String(summary.activeUsers.returningCurrentWeek)}
            />
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <RetentionMetric label="Week 4 retention" data={summary.retention.week4} />
            <RetentionMetric label="Week 8 retention" data={summary.retention.week8} />
          </div>

          <div className="mt-4 rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-text-muted">
              <Users className="h-3.5 w-3.5 text-gold" />
              Validation funnel, unique users
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {Object.entries(summary.funnel).map(([event, users]) => (
                <div key={event}>
                  <div className="font-mono text-lg text-text-primary">{users}</div>
                  <div className="text-[13px] text-text-muted">
                    {event.replaceAll("_", " ")}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-3 text-[12px] leading-4 text-text-muted">
            Retention uses the first observed product event as the cohort start
            and only includes users whose full week-4 or week-8 window has
            closed.
            {data?.potentially_truncated
              ? " Event history reached the query cap; treat cohort rates as incomplete."
              : ""}
          </p>
        </>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="font-mono text-2xl text-text-primary">{value}</div>
      <div className="mt-1 text-[12px] uppercase tracking-[0.1em] text-text-muted">
        {label}
      </div>
    </div>
  );
}

function RetentionMetric({
  label,
  data,
}: {
  label: string;
  data: ProductAnalyticsSummary["retention"]["week4"];
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="font-mono text-2xl text-gold">{formatRate(data.rate)}</div>
      <div className="mt-1 text-xs text-text-secondary">{label}</div>
      <div className="mt-2 text-[12px] text-text-muted">
        {data.retainedUsers} retained / {data.eligibleUsers} eligible
      </div>
    </div>
  );
}
