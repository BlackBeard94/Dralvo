"use client";

import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CircleMinus,
  GitCompareArrows,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import type {
  GoldThesis,
  ThesisDriverState,
} from "@/lib/intelligence/gold-thesis";
import { localizeThesis } from "@/lib/intelligence/localize-thesis";
import { useLocale } from "@/hooks/use-locale";
import { DASHBOARD_COPY } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const stateStyle = {
  supportive: "border-green/30 bg-green/5 text-green",
  adverse: "border-red/30 bg-red/5 text-red",
  mixed: "border-gold/30 bg-gold/5 text-gold",
  insufficient_data: "border-border bg-surface text-text-muted",
} as const;

const relationshipStyle = {
  confirming: "border-green/30 bg-green/5 text-green",
  diverging: "border-gold/40 bg-gold/5 text-gold",
  neutral: "border-border bg-card text-text-secondary",
  insufficient_data: "border-border bg-card text-text-muted",
} as const;

function DriverRow({
  driver,
  states,
}: {
  driver: ThesisDriverState;
  states: Record<string, string>;
}) {
  const Icon =
    driver.state === "supportive"
      ? ArrowUpRight
      : driver.state === "adverse"
        ? ArrowDownRight
        : driver.state === "missing" || driver.state === "stale"
          ? AlertTriangle
          : CircleMinus;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <Icon
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0",
            driver.state === "supportive"
              ? "text-green"
              : driver.state === "adverse"
                ? "text-red"
                : "text-gold",
          )}
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-medium text-text-primary">
              {driver.label}
            </h3>
            <span className="rounded-full border border-border px-2 py-0.5 text-[13px] uppercase tracking-wider text-text-muted">
              {states[driver.state]}
            </span>
          </div>
          <p className="mt-2 text-xs leading-5 text-text-secondary">
            {driver.evidence}
          </p>
          <p className="mt-2 text-[12px] leading-4 text-text-muted">
            Rule: {driver.rule}
          </p>
        </div>
      </div>
    </div>
  );
}

export function TodayThesis() {
  const [thesis, setThesis] = useState<GoldThesis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { locale } = useLocale();
  const copy = DASHBOARD_COPY[locale];
  const displayThesis = thesis ? localizeThesis(thesis, locale) : null;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/thesis/today", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.thesis) {
        throw new Error(data.error ?? `HTTP ${response.status}`);
      }
      setThesis(data.thesis);
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Thesis unavailable",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!displayThesis) {
    return (
      <section className="rounded-2xl border border-border bg-surface p-6">
        <p className="text-sm text-text-secondary">
          {loading ? copy.today.loading : copy.today.unavailable}
        </p>
        {error && <p className="mt-2 font-mono text-xs text-red">{error}</p>}
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[12px] uppercase tracking-[0.18em] text-gold">
            {copy.today.eyebrow}
          </p>
          <h2 className="mt-2 font-display text-2xl text-text-primary">
            {displayThesis.title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
            {displayThesis.summary}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "rounded-full border px-3 py-1 text-[12px] uppercase tracking-wider",
              stateStyle[displayThesis.state],
            )}
          >
            {copy.states[displayThesis.state]}
          </span>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg border border-border p-2 text-text-muted hover:border-border-gold hover:text-gold"
            aria-label="Refresh thesis"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          [copy.today.coverage[0], displayThesis.coverage.available],
          [copy.today.coverage[1], displayThesis.coverage.required],
          [copy.today.coverage[2], displayThesis.coverage.stale],
          [copy.today.coverage[3], displayThesis.coverage.missing],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-border bg-card px-3 py-2">
            <p className="text-[13px] uppercase tracking-wider text-text-muted">
              {label}
            </p>
            <p className="mt-1 font-mono text-lg text-text-primary">{value}</p>
          </div>
        ))}
      </div>

      {displayThesis.priceRelationship && (
        <div
          className={cn(
            "mt-5 rounded-xl border p-4",
            relationshipStyle[displayThesis.priceRelationship.state],
          )}
        >
          <div className="flex items-start gap-3">
            <GitCompareArrows className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="text-[12px] uppercase tracking-[0.14em] opacity-75">
                {copy.today.relationshipHeading}
              </p>
              <h3 className="mt-1 font-display text-lg text-text-primary">
                {displayThesis.priceRelationship.title}
              </h3>
              <p className="mt-1 text-xs leading-5 text-text-secondary">
                {displayThesis.priceRelationship.summary}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {displayThesis.drivers.map((driver) => (
          <DriverRow key={driver.driverKey} driver={driver} states={copy.states} />
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-border bg-card p-4">
        <h3 className="text-xs uppercase tracking-[0.14em] text-text-secondary">
          {copy.today.changeHeading}
        </h3>
        <ul className="mt-3 grid gap-2 text-xs leading-5 text-text-muted md:grid-cols-2">
          {displayThesis.changeConditions.map((condition) => (
            <li key={condition}>• {condition}</li>
          ))}
        </ul>
      </div>

      <p className="mt-4 text-[12px] text-text-muted">
        {copy.today.methodology} {displayThesis.methodologyVersion} ·{" "}
        {copy.today.generated}{" "}
        {new Date(displayThesis.generatedAt).toLocaleString(
          locale === "pt-BR" ? "pt-BR" : locale,
        )} ·{" "}
        {copy.today.disclaimer}
      </p>
    </section>
  );
}
