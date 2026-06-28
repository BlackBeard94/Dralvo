"use client";

import { useEffect, useState, useCallback } from "react";
import { useLocale } from "@/hooks/use-locale";
import { AFFILIATE_COPY } from "@/lib/affiliate/copy";
import type { AffiliateStats, AffiliateCommission, Affiliate } from "@/lib/affiliate/types";

type DashboardData = {
  affiliate: Pick<Affiliate, "id" | "code" | "status" | "display_name" | "created_at">;
  stats: AffiliateStats;
  commissions: AffiliateCommission[];
  referralUrl: string;
} | null;

export default function AffiliateDashboardPage() {
  const { locale } = useLocale();
  const t = AFFILIATE_COPY[locale];
  const d = t.dashboard;
  const [data, setData] = useState<DashboardData>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [applying, setApplying] = useState(false);

  const loadStats = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/affiliate/stats")
      .then((r) => r.json())
      .then((json) => {
        if (json.error) { setError(json.error); return; }
        setData(json as DashboardData);
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const handleApply = async () => {
    setApplying(true);
    try {
      const r = await fetch("/api/affiliate/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await r.json();
      if (json.success) {
        loadStats(); // reload → now shows pending dashboard
      } else {
        setError(json.error || "Failed to apply");
      }
    } catch {
      setError("Failed to apply");
    }
    setApplying(false);
  };

  const copyLink = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.referralUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Not an affiliate yet ──
  if (!loading && error === "Not an affiliate") {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-text-primary">{d.title}</h1>
        <div className="rounded-xl border border-border bg-card p-8 text-center max-w-[520px]">
          <h2 className="text-lg font-semibold text-text-primary mb-2">{d.notAffiliateTitle}</h2>
          <p className="text-text-secondary text-sm mb-6">{d.notAffiliateBody}</p>
          <button
            onClick={handleApply}
            disabled={applying}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-gold-bright text-[#060609] text-sm font-semibold cursor-pointer border-none hover:scale-[1.02] transition-transform disabled:opacity-60"
          >
            {applying ? d.applying : d.applyNow}
          </button>
          {error && error !== "Not an affiliate" && <p className="text-red text-xs mt-3">{error}</p>}
        </div>
        <div className="max-w-[520px] rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold text-text-primary text-sm mb-3">{d.howTitle}</h3>
          <div className="space-y-3">
            {d.howSteps.map((step: string, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-mono text-gold font-bold">{i + 1}</span>
                </span>
                <span className="text-[13px] text-text-secondary">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-text-muted">Loading...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-red/20 bg-red/5 p-8 text-center">
          <p className="text-red text-sm">{error || "Something went wrong"}</p>
          <button onClick={loadStats} className="mt-4 text-sm text-gold hover:underline border-none bg-transparent cursor-pointer">Retry</button>
        </div>
      </div>
    );
  }

  const statusBadge = (s: string) => {
    const map: Record<string, { label: string; bg: string }> = {
      pending: { label: d.statusPending, bg: "rgba(240,185,11,0.15)" },
      active: { label: d.statusActive, bg: "rgba(14,203,129,0.15)" },
      suspended: { label: d.statusSuspended, bg: "rgba(246,70,93,0.15)" },
      rejected: { label: d.statusRejected, bg: "rgba(246,70,93,0.15)" },
    };
    const m = map[s] ?? map.pending;
    return <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ background: m.bg, color: s === "active" ? "#0ECB81" : s === "suspended" ? "#F6465D" : "#F0B90B" }}>{m.label}</span>;
  };

  const commStatus = (s: string) => {
    const map: Record<string, string> = {
      pending: d.commissions.statusPending,
      paid: d.commissions.statusPaid,
      cancelled: d.commissions.statusCancelled,
      refunded: d.commissions.statusRefunded,
    };
    return map[s] ?? s;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">{d.title}</h1>
          <div className="flex items-center gap-3 mt-1.5">
            {statusBadge(data.affiliate.status)}
            <span className="text-[12px] text-text-muted font-mono">ID: {data.affiliate.code}</span>
          </div>
        </div>
      </div>

      {/* Pending approval notice */}
      {data.affiliate.status === "pending" && (
        <div className="rounded-xl border border-gold/30 bg-gold/5 p-5">
          <p className="text-sm text-text-primary font-medium">{d.pendingNotice}</p>
          <p className="text-[12px] text-text-muted mt-1">{d.pendingNoticeDetail}</p>
        </div>
      )}

      {/* Referral link */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="text-[11px] tracking-[0.08em] uppercase text-text-muted mb-3">{d.referralLink}</div>
        <div className="flex items-center gap-3">
          <code className="flex-1 rounded-md border border-border bg-deep px-4 py-2.5 text-sm text-text-primary font-mono truncate">{data.referralUrl}</code>
          <button onClick={copyLink} className="shrink-0 rounded-md bg-gold-bright text-[#060609] text-sm font-semibold px-4 py-2.5 cursor-pointer border-none hover:scale-[1.02] transition-transform">
            {copied ? d.copied : d.copyLink}
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1  grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { key: "clicks", value: data.stats.total_clicks, label: d.stats.clicks },
          { key: "conversions", value: data.stats.total_conversions, label: d.stats.conversions },
          { key: "conversionRate", value: `${data.stats.conversion_rate.toFixed(1)}%`, label: d.stats.conversionRate },
          { key: "pendingEarnings", value: `$${data.stats.pending_earnings.toFixed(2)}`, label: d.stats.pendingEarnings },
          { key: "totalEarned", value: `$${data.stats.total_earned.toFixed(2)}`, label: d.stats.totalEarned },
          { key: "paidOut", value: `$${data.stats.paid_out.toFixed(2)}`, label: d.stats.paidOut },
          { key: "available", value: `$${data.stats.available_for_payout.toFixed(2)}`, label: d.stats.available },
        ].map((s) => (
          <div key={s.key} className="rounded-xl border border-border bg-card p-4">
            <div className="text-xl font-bold text-text-primary font-mono">{s.value}</div>
            <div className="text-[11px] text-text-muted mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Payout CTA */}
      {data.affiliate.status === "active" && (
        <div className="rounded-xl border border-border bg-card p-5 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-sm font-semibold text-text-primary">{d.requestPayout}</div>
            <div className="text-[12px] text-text-muted mt-0.5">
              {data.stats.available_for_payout >= 50
                ? `${d.stats.available}: $${data.stats.available_for_payout.toFixed(2)}`
                : `${d.notEligible} ($${data.stats.available_for_payout.toFixed(2)} / $50)`}
            </div>
          </div>
          <button
            disabled={data.stats.available_for_payout < 50}
            className="rounded-md bg-gold-bright text-[#060609] text-sm font-semibold px-5 py-2.5 cursor-pointer border-none hover:scale-[1.02] transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {d.requestPayout}
          </button>
        </div>
      )}

      {/* Commission history */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4">{d.commissions.title}</h2>
        {data.commissions.length === 0 ? (
          <p className="text-text-muted text-sm">{d.commissions.empty}</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.05em] text-text-muted border-b border-border">
                  <th className="text-left font-medium py-3 px-4">{d.commissions.date}</th>
                  <th className="text-right font-medium py-3 px-4">{d.commissions.amount}</th>
                  <th className="text-right font-medium py-3 px-4">{d.commissions.source}</th>
                  <th className="text-right font-medium py-3 px-4">{d.commissions.status}</th>
                </tr>
              </thead>
              <tbody>
                {data.commissions.map((c) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="py-3 px-4 text-text-secondary">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right font-mono text-green">${c.amount.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-text-muted">${(c.source_amount ?? 0).toFixed(2)}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`text-[11px] font-medium ${c.status === "paid" ? "text-green" : c.status === "cancelled" ? "text-red" : "text-text-muted"}`}>
                        {commStatus(c.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
