"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CreditCard } from "lucide-react";

import { hasProAccess, planStatusLabel } from "@/lib/stripe-subscriptions";

type BillingPanelProps = {
  planTier: string;
  planStatus?: string;
  currentPeriodEnd?: string | null;
};

export function BillingPanel({
  planTier,
  planStatus = "free",
  currentPeriodEnd = null,
}: BillingPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canManageBilling = hasProAccess(planStatus);
  const periodLabel = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  async function openBillingPortal() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok || !body.url) {
        throw new Error(body.error || "Failed to open billing portal.");
      }

      window.location.href = body.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open billing portal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-5">
      <div className="mb-3 flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-gold" />
        <h2 className="font-display text-lg text-text-primary">Billing</h2>
      </div>

      <div className="mb-4 grid gap-2 rounded-xl border border-border bg-card/70 p-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-text-muted">Current plan</span>
          <span className="font-mono text-text-primary">{planTier}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-text-muted">Billing status</span>
          <span className="font-mono text-text-primary">
            {planStatusLabel(planStatus)}
          </span>
        </div>
        {planStatus === "trialing" && (
          <p className="text-xs leading-5 text-gold">
            Your 3-day Pro trial is active
            {periodLabel ? ` until ${periodLabel}` : ""}. Stripe manages the exact renewal date in the billing portal.
          </p>
        )}
        {planStatus === "active" && periodLabel && (
          <p className="text-xs leading-5 text-text-muted">
            Next billing period ends on {periodLabel}.
          </p>
        )}
        {planStatus === "canceled" && (
          <p className="text-xs leading-5 text-red">
            Subscription is canceled
            {periodLabel ? ` and access remains until ${periodLabel}` : ""}.
          </p>
        )}
        {planStatus === "past_due" && (
          <p className="text-xs leading-5 text-red">
            Payment is past due. Update your card in the billing portal to restore Pro access.
          </p>
        )}
      </div>

      {canManageBilling ? (
        <button
          type="button"
          onClick={openBillingPortal}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-border-gold px-4 py-2 text-xs font-semibold text-gold no-underline hover:bg-gold/10 disabled:opacity-60"
        >
          {loading ? "Opening billing..." : "Manage billing"}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      ) : (
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 rounded-lg border border-border-gold px-4 py-2 text-xs font-semibold text-gold no-underline hover:bg-gold/10"
        >
          Upgrade to Pro
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}

      {error && <p className="mt-3 text-xs text-red">{error}</p>}
    </div>
  );
}
