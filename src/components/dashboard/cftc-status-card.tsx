"use client";

import { useEffect, useState } from "react";
import { Activity, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { useLocale } from "@/hooks/use-locale";
import { DASHBOARD_COPY } from "@/lib/i18n";

type CftcStatus = {
  ok: boolean;
  bullish: boolean;
  mm_net: number;
  updated: string;
  fetched_at?: string;
  source: string;
};

function formatNet(n: number): string {
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${Math.abs(n).toLocaleString("en-US")}`;
}

export function CftcStatusCard() {
  const { locale } = useLocale();
  const c = DASHBOARD_COPY[locale].cftcStatus;
  const [status, setStatus] = useState<CftcStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/cftc-status", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        setStatus(d as CftcStatus);
      })
      .catch(() => active && setFailed(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const bullish = status?.bullish ?? false;
  const accent = bullish ? "#00c98d" : "#e5544b";

  return (
    <div
      className="card-elevate rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-4 h-full"
      style={{ borderColor: `${accent}55`, background: `linear-gradient(135deg, ${accent}0d, var(--bg-card) 70%)` }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${accent}1a`, border: `1px solid ${accent}40` }}
        >
          <Activity className="h-4 w-4" style={{ color: accent }} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.12em] text-text-muted">{c.label}</p>
          {loading ? (
            <p className="flex items-center gap-1.5 text-sm text-text-muted mt-0.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> {c.loading}
            </p>
          ) : failed ? (
            <p className="text-sm text-text-muted mt-0.5">{c.loadError}</p>
          ) : (
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="inline-flex items-center gap-1 text-sm font-semibold"
                style={{ color: accent }}
              >
                {bullish ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {bullish ? c.bullish : c.bearish}
              </span>
              <span className="text-xs text-text-muted">
                {c.netLabel} <span className="font-mono text-text-secondary">{formatNet(status?.mm_net ?? 0)}</span> {c.contractsUnit}
              </span>
            </div>
          )}
        </div>
      </div>

      {!loading && !failed && (
        <div className="sm:ml-auto flex items-center gap-4 text-[11px] text-text-muted">
          <span>
            {c.updatedLabel} <span className="text-text-secondary">{status?.updated}</span>
          </span>
          {status?.source === "fallback" && (
            <span className="rounded px-1.5 py-0.5 bg-gold/10 text-gold text-[10px]">{c.fallbackBadge}</span>
          )}
        </div>
      )}
    </div>
  );
}
