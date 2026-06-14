"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  CircleMinus,
  ShieldCheck,
} from "lucide-react";

const previewDrivers = [
  {
    label: "10Y real yield",
    state: "Supportive",
    detail: "Falling real-yield pressure",
    icon: ArrowUpRight,
    tone: "text-green",
  },
  {
    label: "CFTC positioning",
    state: "Supportive",
    detail: "Managed Money adding exposure",
    icon: ArrowUpRight,
    tone: "text-green",
  },
  {
    label: "GLD holdings",
    state: "Adverse",
    detail: "Issuer holdings declined",
    icon: ArrowDownRight,
    tone: "text-red",
  },
  {
    label: "COMEX inventory",
    state: "Neutral",
    detail: "No material registered-stock move",
    icon: CircleMinus,
    tone: "text-gold",
  },
];

export function ChartPreview() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border-gold/40 bg-surface shadow-[0_36px_90px_rgba(0,0,0,0.42)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(212,168,67,0.12),transparent_42%)]" />
      <div className="relative">
        <div className="flex items-center justify-between border-b border-border bg-card/80 px-5 py-4">
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] text-text-muted">
              Product preview / illustrative
            </p>
            <p className="mt-1 font-mono text-xs text-text-secondary">
              Today&apos;s gold thesis
            </p>
          </div>
          <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[9px] uppercase tracking-[0.14em] text-gold">
            Mixed
          </span>
        </div>

        <div className="p-5 md:p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-gold" />
            <div>
              <h2 className="font-display text-2xl text-text-primary">
                Macro and positioning support gold, ETF demand disagrees.
              </h2>
              <p className="mt-2 text-xs leading-5 text-text-muted">
                Dralvo separates evidence from interpretation and shows what
                would invalidate the current view.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {previewDrivers.map((driver) => {
              const Icon = driver.icon;
              return (
                <div
                  key={driver.label}
                  className="rounded-xl border border-border bg-card/70 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-text-primary">
                      {driver.label}
                    </span>
                    <Icon className={`h-4 w-4 ${driver.tone}`} />
                  </div>
                  <p className={`mt-2 text-[10px] uppercase tracking-wider ${driver.tone}`}>
                    {driver.state}
                  </p>
                  <p className="mt-1 text-[10px] leading-4 text-text-muted">
                    {driver.detail}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-xl border border-border-gold/30 bg-gold/5 p-4">
            <p className="text-[9px] uppercase tracking-[0.16em] text-gold">
              Thesis changes when
            </p>
            <p className="mt-2 text-xs leading-5 text-text-secondary">
              Real yields reverse higher, GLD holdings recover materially, or
              price diverges from the fundamental driver balance.
            </p>
          </div>

          <p className="mt-4 text-[9px] text-text-muted">
            Example layout only. Production values appear only from verified
            source ingestion. Not a buy/sell signal.
          </p>
        </div>
      </div>
    </div>
  );
}
