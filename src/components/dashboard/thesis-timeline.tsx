"use client";

import { ArrowRight, GitCompareArrows, History, Minus } from "lucide-react";
import { useEffect, useState } from "react";

import { useLocale } from "@/hooks/use-locale";
import { DASHBOARD_COPY } from "@/lib/i18n";
import { localizeDriverLabel } from "@/lib/intelligence/localize-thesis";
import type { ThesisTimelineEntry } from "@/lib/intelligence/thesis-history";
import { cn } from "@/lib/utils";

const stateTone = {
  supportive: "text-green",
  adverse: "text-red",
  mixed: "text-gold",
  insufficient_data: "text-text-muted",
} as const;

function stateLabel(
  state: string | null,
  states: Record<string, string>,
) {
  if (!state) return "not recorded";
  return states[state as keyof typeof states] ?? state.replace("_", " ");
}

export function ThesisTimeline() {
  const [timeline, setTimeline] = useState<ThesisTimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { locale } = useLocale();
  const copy = DASHBOARD_COPY[locale];

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch("/api/thesis/history", {
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok || !Array.isArray(data.timeline)) {
          throw new Error(data.error ?? `HTTP ${response.status}`);
        }
        if (active) {
          setTimeline(data.timeline);
          setError(null);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Thesis history unavailable",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 md:p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-lg border border-border-gold bg-gold/10 p-2 text-gold">
          <History className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[12px] uppercase tracking-[0.18em] text-gold">
            {copy.timeline.eyebrow}
          </p>
          <h2 className="mt-1 font-display text-xl text-text-primary">
            {copy.timeline.title}
          </h2>
          <p className="mt-1 text-xs leading-5 text-text-muted">
            {copy.timeline.description}
          </p>
        </div>
      </div>

      {loading && (
        <p className="mt-5 text-sm text-text-muted">
          {copy.timeline.loading}
        </p>
      )}

      {!loading && error && (
        <p className="mt-5 font-mono text-xs text-red">{error}</p>
      )}

      {!loading && !error && timeline.length === 0 && (
        <div className="mt-5 rounded-xl border border-dashed border-border p-5">
          <p className="text-sm text-text-secondary">
            {copy.timeline.empty}
          </p>
          <p className="mt-1 text-xs leading-5 text-text-muted">
            {copy.timeline.emptyDetail}
          </p>
        </div>
      )}

      {timeline.length > 0 && (
        <ol className="mt-6 space-y-5">
          {timeline.slice(0, 7).map((entry) => (
            <li
              key={`${entry.thesisDate}-${entry.generatedAt}`}
              className="relative border-l border-border pl-5"
            >
              <span
                className={cn(
                  "absolute -left-1.5 top-1 h-3 w-3 rounded-full border-2 border-surface bg-current",
                  stateTone[entry.state],
                )}
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <time
                  dateTime={entry.generatedAt}
                  className="font-mono text-[12px] text-text-muted"
                >
                  {new Date(entry.generatedAt).toLocaleDateString(
                    locale === "pt-BR" ? "pt-BR" : locale,
                  )}
                </time>
                <span
                  className={cn(
                    "text-[12px] uppercase tracking-wider",
                    stateTone[entry.state],
                  )}
                >
                  {stateLabel(entry.state, copy.states)}
                </span>
              </div>

              <p className="mt-2 text-sm font-medium text-text-primary">
                {entry.isInitial
                  ? copy.timeline.initial
                  : entry.stateChanged
                    ? `${copy.timeline.changedFrom} ${stateLabel(entry.previousState, copy.states)}`
                    : copy.timeline.held}
              </p>

              {entry.driverChanges.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {entry.driverChanges.map((change) => (
                    <div
                      key={change.driverKey}
                      className="flex flex-wrap items-center gap-2 text-xs text-text-muted"
                    >
                      <span className="text-text-secondary">
                        {localizeDriverLabel(change.driverKey, locale)}
                      </span>
                      <span>{stateLabel(change.from, copy.states)}</span>
                      <ArrowRight className="h-3 w-3 text-gold" />
                      <span>{stateLabel(change.to, copy.states)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-2 text-xs text-text-muted">
                  <Minus className="h-3 w-3" />
                  {copy.timeline.noDriverChange}
                </div>
              )}

              {entry.priceRelationshipChange && (
                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-gold/20 bg-gold/5 px-3 py-2 text-xs text-text-muted">
                  <GitCompareArrows className="h-3 w-3 text-gold" />
                  <span className="text-text-secondary">
                    {copy.timeline.relationshipChanged}
                  </span>
                  <span>
                    {
                      copy.timeline.relationshipStates[
                        entry.priceRelationshipChange.from ??
                          "insufficient_data"
                      ]
                    }
                  </span>
                  <ArrowRight className="h-3 w-3 text-gold" />
                  <span>
                    {
                      copy.timeline.relationshipStates[
                        entry.priceRelationshipChange.to
                      ]
                    }
                  </span>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
