"use client";

import { cn } from "@/lib/utils";
import type { Alert } from "@/types/alerts";
import { formatCondition } from "@/types/alerts";

const INDICATOR_NAMES: Record<string, string> = {
  "thesis:overall": "Gold thesis state",
  "thesis:price-relationship": "Price vs fundamental relationship",
  "thesis:xauusd-price-context": "Driver: XAUUSD Price Context",
  "thesis:tips-real-yield": "Driver: 10Y TIPS Real Yield",
  "thesis:cftc-gold-positioning": "Driver: CFTC Gold Positioning",
  "thesis:comex-gold-inventory": "Driver: COMEX Gold Inventory",
  "thesis:gld-gold-holdings": "Driver: GLD Gold Holdings",
  "xauusd-spot": "XAUUSD Spot Price",
  "xauusd-rsi": "XAUUSD RSI (14)",
  "xauusd-macd": "XAUUSD MACD",
  "xauusd-sma": "XAUUSD SMA (9/20)",
  "tips-yields": "TIPS Real Yields",
  "gold-btc-correlation": "Gold-BTC Correlation",
};

type Props = {
  alert: Alert;
  onToggle: (id: string, active: boolean) => void;
  onEdit: (alert: Alert) => void;
  onDelete: (id: string) => void;
};

export function AlertCard({ alert, onToggle, onEdit, onDelete }: Props) {
  const indicatorName =
    INDICATOR_NAMES[alert.indicator_key] ?? alert.indicator_key;
  const conditionText = formatCondition(alert.condition_json);

  return (
    <div
      className={cn(
        "group relative rounded-lg border p-4 transition-all duration-200",
        alert.active
          ? "border-gold/20 bg-card hover:border-gold/40"
          : "border-border/50 bg-card/50 opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={cn(
              "mt-0.5 h-2 w-2 shrink-0 rounded-full",
              alert.active ? "bg-green animate-pulse" : "bg-text-muted",
            )}
          />
          <div className="min-w-0">
            <h4 className="font-mono text-sm font-medium text-text-primary truncate">
              {indicatorName}
            </h4>
            <p className="font-mono text-xs text-gold mt-0.5">
              {conditionText}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            type="button"
            onClick={() => onToggle(alert.id, !alert.active)}
            className={cn(
              "h-7 rounded-md border px-2 text-xs font-mono transition-colors",
              alert.active
                ? "border-green/30 text-green hover:bg-green/10"
                : "border-text-muted/30 text-text-muted hover:bg-text-muted/10",
            )}
            title={alert.active ? "Disable alert" : "Enable alert"}
          >
            {alert.active ? "ON" : "OFF"}
          </button>

          <button
            type="button"
            onClick={() => onEdit(alert)}
            className="h-7 rounded-md border border-gold/30 px-2 text-gold-pale text-xs font-mono hover:bg-gold/10 transition-colors"
            title="Edit alert"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => onDelete(alert.id)}
            className="h-7 rounded-md border border-red/30 px-2 text-red text-xs font-mono hover:bg-red/10 transition-colors"
            title="Delete alert"
          >
            Del
          </button>
        </div>
      </div>

      <p className="font-mono text-[12px] text-text-muted mt-3">
        Created {new Date(alert.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </p>
    </div>
  );
}
