"use client";

import { Database, ShieldAlert } from "lucide-react";

export function CorrelationMatrix() {
  return (
    <section className="rounded-2xl border border-border bg-surface p-6 md:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] text-gold">
            <ShieldAlert className="h-4 w-4" />
            Verification gate
          </div>
          <h2 className="mt-3 font-display text-2xl text-text-primary">
            Cross-driver matrix is not published yet
          </h2>
          <p className="mt-3 text-sm leading-6 text-text-muted">
            The previous matrix used fixed demonstration coefficients and could
            be mistaken for a real 30-day calculation. It has been removed from
            the production dashboard. Dralvo will publish this view only after
            aligned historical series, missing-value rules, window definitions,
            and reproducible methodology are available.
          </p>
        </div>

        <div className="w-full rounded-xl border border-border bg-card p-5 lg:max-w-sm">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-gold" />
            <h3 className="text-sm font-medium text-text-primary">
              Required evidence
            </h3>
          </div>
          <ul className="mt-4 space-y-3 text-xs leading-5 text-text-muted">
            <li>Aligned XAUUSD, TIPS, CFTC, COMEX, and ETF history</li>
            <li>Published lookback and release-lag treatment</li>
            <li>Minimum observation count and confidence checks</li>
            <li>Source-linked calculation output stored for audit</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
