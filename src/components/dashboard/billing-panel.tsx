"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CreditCard, Loader2 } from "lucide-react";

import { isPaidTier, planDisplayName, type PlanSource } from "@/lib/plan";
import { useLocale } from "@/hooks/use-locale";
import { DASHBOARD_COPY } from "@/lib/i18n";

type BillingDetail = {
  plan: string;
  isPaid: boolean;
  source: PlanSource;
  status: string;
  isLifetime: boolean;
  activatedAt: string | null;
  expiresAt: string | null;
  canManageBilling: boolean;
};

type BillingPanelProps = {
  planTier: string;
  planStatus?: string;
  currentPeriodEnd?: string | null;
  planSource?: PlanSource;
};

function fmtDate(iso: string | null, locale: string): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "numeric" });
}

function daysLeft(iso: string | null): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return diff > 0 ? Math.ceil(diff / 86_400_000) : 0;
}

export function BillingPanel({
  planTier,
  planStatus = "free",
  currentPeriodEnd = null,
  planSource = "none",
}: BillingPanelProps) {
  const { locale } = useLocale();
  const c = DASHBOARD_COPY[locale].billingPanel;
  // Seed from the props passed by the page, then enrich with the billing detail
  // endpoint (activation date, precise lifetime/expiry, manage-billing).
  const [detail, setDetail] = useState<BillingDetail>({
    plan: planDisplayName(planTier),
    isPaid: isPaidTier(planTier),
    source: planSource,
    status: planStatus,
    isLifetime: planSource === "license" && !currentPeriodEnd,
    activatedAt: null,
    expiresAt: currentPeriodEnd,
    canManageBilling: planSource === "subscription",
  });
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/user/billing", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: BillingDetail | null) => {
        if (active && d) setDetail(d);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  async function openBillingPortal() {
    setPortalLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/stripe/portal", { method: "POST" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.url) throw new Error(body.error || c.portalError);
      window.location.href = body.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : c.portalError);
    } finally {
      setPortalLoading(false);
    }
  }

  const { plan, isPaid, source, isLifetime, activatedAt, expiresAt, canManageBilling } = detail;

  const typeLabel = isLifetime
    ? c.typeLifetime
    : source === "subscription"
      ? c.typeSubscription
      : isPaid
        ? c.typePaid
        : c.typeFree;
  const left = daysLeft(expiresAt);

  return (
    <div className="card-elevate rounded-2xl border border-border bg-surface/60 p-5">
      <div className="mb-3 flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-gold" />
        <h2 className="font-display text-lg text-text-primary">{c.heading}</h2>
      </div>

      {/* Detail rows */}
      <div className="mb-4 grid gap-2 rounded-xl border border-border bg-card/70 p-3 text-sm">
        <Row label={c.currentPlan} value={<span className="font-semibold text-gold">{plan}</span>} />
        <Row label={c.type} value={typeLabel} />
        {activatedAt && <Row label={c.activatedAt} value={fmtDate(activatedAt, locale) ?? "—"} />}
        <Row
          label={c.term}
          value={
            isLifetime || !expiresAt ? (
              c.termLifetime
            ) : (
              <span>
                {fmtDate(expiresAt, locale)}
                {left !== null && (
                  <span className={left <= 7 ? "text-red" : "text-text-muted"}> · {c.daysLeft.replace("{n}", String(left))}</span>
                )}
              </span>
            )
          }
        />
      </div>

      {/* Action */}
      {canManageBilling ? (
        <button
          type="button"
          onClick={openBillingPortal}
          disabled={portalLoading}
          className="inline-flex items-center gap-2 rounded-lg border border-border-gold px-4 py-2 text-xs font-semibold text-gold no-underline hover:bg-gold/10 disabled:opacity-60"
        >
          {portalLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
          {portalLoading ? c.opening : c.manageBilling}
        </button>
      ) : isPaid ? (
        <p className="text-xs text-text-muted">
          {c.directActivationNote}
        </p>
      ) : (
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 rounded-lg border border-border-gold px-4 py-2 text-xs font-semibold text-gold no-underline hover:bg-gold/10"
        >
          {c.upgrade}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}

      {error && <p className="mt-3 text-xs text-red">{error}</p>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-text-muted">{label}</span>
      <span className="font-mono text-text-primary text-right">{value}</span>
    </div>
  );
}
