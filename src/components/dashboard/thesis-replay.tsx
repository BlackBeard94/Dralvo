"use client";

import { CalendarSearch, GitCompareArrows, Loader2 } from "lucide-react";
import { useState } from "react";

import { useLocale } from "@/hooks/use-locale";
import { DASHBOARD_COPY } from "@/lib/i18n";
import type { GoldThesis } from "@/lib/intelligence/gold-thesis";
import { localizeThesis } from "@/lib/intelligence/localize-thesis";
import { cn } from "@/lib/utils";

const tone = {
  supportive: "text-green border-green/30 bg-green/5",
  adverse: "text-red border-red/30 bg-red/5",
  mixed: "text-gold border-gold/30 bg-gold/5",
  insufficient_data: "text-text-muted border-border bg-card",
} as const;

export function ThesisReplay({ isPro }: { isPro: boolean }) {
  const { locale } = useLocale();
  const copy = DASHBOARD_COPY[locale].replay;
  const states = DASHBOARD_COPY[locale].states;
  const [date, setDate] = useState("");
  const [thesis, setThesis] = useState<GoldThesis | null>(null);
  const [evidenceCount, setEvidenceCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const displayThesis = thesis ? localizeThesis(thesis, locale) : null;

  async function replay() {
    if (!date) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/thesis/replay?date=${encodeURIComponent(date)}`,
        { cache: "no-store" },
      );
      const data = await response.json();
      if (!response.ok || !data.thesis) {
        throw new Error(data.error ?? `HTTP ${response.status}`);
      }
      setThesis(data.thesis);
      setEvidenceCount(data.evidenceCount ?? 0);
    } catch (replayError) {
      setThesis(null);
      setError(
        replayError instanceof Error ? replayError.message : "Replay failed",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-5">
      <div>
        <p className="text-[12px] uppercase tracking-[0.18em] text-gold">
          {copy.eyebrow}
        </p>
        <h1 className="mt-2 font-display text-3xl text-text-primary">
          {copy.title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
          {copy.description}
        </p>
      </div>

      {!isPro ? (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center">
          <CalendarSearch className="mx-auto h-6 w-6 text-gold" />
          <h2 className="mt-3 font-display text-xl text-text-primary">
            {copy.proTitle}
          </h2>
          <p className="mt-2 text-sm text-text-muted">
            {copy.proDescription}
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-end">
            <label className="flex-1 text-xs text-text-secondary">
              {copy.date}
              <input
                type="date"
                value={date}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(event) => setDate(event.target.value)}
                className="mt-2 w-full rounded-lg border border-border bg-card px-3 py-2.5 font-mono text-sm text-text-primary"
              />
            </label>
            <button
              type="button"
              onClick={() => void replay()}
              disabled={!date || loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gold px-5 text-sm font-semibold text-deep disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {copy.run}
            </button>
          </div>

          {error && (
            <p className="rounded-xl border border-red/30 bg-red/5 p-4 font-mono text-xs text-red">
              {error}
            </p>
          )}

          {displayThesis && (
            <section className="rounded-2xl border border-border bg-surface p-5 md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[12px] text-text-muted">
                    {evidenceCount} {copy.evidenceCount}
                  </p>
                  <h2 className="mt-2 font-display text-2xl text-text-primary">
                    {displayThesis.title}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
                    {displayThesis.summary}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full border px-3 py-1 text-[12px] uppercase tracking-wider",
                    tone[displayThesis.state],
                  )}
                >
                  {states[displayThesis.state]}
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {displayThesis.drivers.map((driver) => (
                  <div
                    key={driver.driverKey}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm text-text-primary">
                        {driver.label}
                      </h3>
                      <span className="text-[13px] uppercase tracking-wider text-gold">
                        {states[driver.state]}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-text-muted">
                      {driver.evidence}
                    </p>
                  </div>
                ))}
              </div>

              {displayThesis.priceRelationship && (
                <div className="mt-5 rounded-xl border border-gold/30 bg-gold/5 p-4">
                  <div className="flex items-start gap-3">
                    <GitCompareArrows className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                    <div>
                      <h3 className="font-display text-lg text-text-primary">
                        {displayThesis.priceRelationship.title}
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-text-muted">
                        {displayThesis.priceRelationship.summary}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
