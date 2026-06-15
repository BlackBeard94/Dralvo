import type { IndicatorSnapshot } from "@/data/indicators";
import { cn } from "@/lib/utils";

const statusClasses = {
  bullish: "text-green border-green/30 bg-green/10",
  neutral: "text-gold border-gold/30 bg-gold/10",
  bearish: "text-red border-red/30 bg-red/10",
};

export function IndicatorCard({
  indicator,
  highlighted = false,
  justUpdated = false,
}: {
  indicator: IndicatorSnapshot;
  highlighted?: boolean;
  justUpdated?: boolean;
}) {
  return (
    <article
      className={cn(
        "bg-surface border rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1",
        highlighted
          ? "border-gold/40 bg-gradient-to-br from-surface via-surface to-gold/5 hover:border-gold/60"
          : "border-border hover:border-border-gold",
        justUpdated && "border-gold/60 shadow-[0_0_12px_rgba(212,168,67,0.12)]"
      )}
    >
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h3 className="font-display text-xl text-text-primary mb-1">{indicator.name}</h3>
          <p className="text-[13px] text-text-muted font-mono">{indicator.source}</p>
        </div>
        <span
          className={cn(
            "rounded-full border px-3 py-1 text-[12px] uppercase tracking-[0.14em]",
            statusClasses[indicator.status]
          )}
        >
          {indicator.status}
        </span>
      </div>
      <div className="flex items-end justify-between gap-4 mb-4">
        <div className="font-mono text-2xl text-gold-bright">{indicator.value}</div>
        <div className="text-xs text-text-muted">{indicator.change}</div>
      </div>
      <p className="text-sm leading-relaxed text-text-secondary mb-5">{indicator.summary}</p>
      <div className="flex items-center justify-between border-t border-border pt-4 text-[13px] text-text-muted">
        <span>{indicator.cadence}</span>
        <span>{indicator.observedLabel}</span>
      </div>
    </article>
  );
}
