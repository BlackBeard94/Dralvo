"use client";

import { useState, useEffect, useCallback } from "react";
import { Lock, X, ArrowRight, Download } from "lucide-react";
import Link from "next/link";

import { MarketHeader } from "@/components/dashboard/market-header";
import { XauusdChart } from "@/components/dashboard/xauusd-chart";
import { IndicatorDetailCard } from "@/components/dashboard/indicator-detail-card";
import { AlertList } from "@/components/dashboard/alert-list";
import { NotificationPreferences } from "@/components/dashboard/notification-preferences";
import { TodayThesis } from "@/components/dashboard/today-thesis";
import { ThesisTimeline } from "@/components/dashboard/thesis-timeline";
import { AlertNotifications } from "@/components/dashboard/alert-notifications";
import { useIndicatorStream } from "@/hooks/use-indicator-stream";
import { useLocale } from "@/hooks/use-locale";
import { DASHBOARD_COPY } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Props                                                                     */
/* -------------------------------------------------------------------------- */

export interface DashboardPageClientProps {
  planTier?: string;
}

/* -------------------------------------------------------------------------- */
/*  Upgrade Banner                                                            */
/* -------------------------------------------------------------------------- */

const UPGRADE_BANNER_KEY = "dralvo-upgrade-banner-dismissed";

function UpgradeBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const stored = localStorage.getItem(UPGRADE_BANNER_KEY);
      if (!stored) setDismissed(false);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(UPGRADE_BANNER_KEY, "true");
    setDismissed(true);
  }, []);

  if (dismissed) return null;

  return (
    <div
      className={cn(
        "relative flex items-center justify-between gap-4 px-5 py-4 rounded-xl",
        "bg-gradient-to-r from-gold/10 via-gold/5 to-surface",
        "border border-border-gold",
        "animate-fade-in-up",
      )}
    >
      {/* Left: icon + message */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="shrink-0 w-9 h-9 rounded-lg bg-gold/15 flex items-center justify-center">
          <Lock className="w-4 h-4 text-gold" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary">
            You are on the Free plan
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            Upgrade to Pro for the complete verified evidence surface, custom alerts, exports, and research workflows.
          </p>
        </div>
      </div>

      {/* Right: CTA + dismiss */}
      <div className="flex items-center gap-3 shrink-0">
        <Link
          href="/pricing"
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold tracking-[0.03em]",
            "bg-gold-action text-[#060609] hover:bg-gold-actionHover transition-all duration-300",
            "hover:shadow-[0_4px_16px_rgba(212,168,67,0.25)]",
            "no-underline whitespace-nowrap",
          )}
        >
          Upgrade to Pro
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
          aria-label="Dismiss upgrade banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

type CheckoutStatus = "success" | "sync_failed" | "missing_session";

function CheckoutStatusBanner() {
  const { locale } = useLocale();
  const copy = DASHBOARD_COPY[locale].checkout;
  const [status, setStatus] = useState<CheckoutStatus | null>(null);

  useEffect(() => {
    const checkout = new URLSearchParams(window.location.search).get("checkout");
    if (
      checkout === "success" ||
      checkout === "sync_failed" ||
      checkout === "missing_session"
    ) {
      setStatus(checkout);
    }
  }, []);

  if (!status) return null;

  const isSuccess = status === "success";
  const title =
    status === "success"
      ? copy.successTitle
      : status === "sync_failed"
        ? copy.syncFailedTitle
        : copy.missingSessionTitle;
  const body =
    status === "success"
      ? copy.successBody
      : status === "sync_failed"
        ? copy.syncFailedBody
        : copy.missingSessionBody;

  return (
    <div
      role="status"
      className={cn(
        "relative flex items-start justify-between gap-4 rounded-xl border px-5 py-4",
        isSuccess
          ? "border-green/30 bg-green/10"
          : "border-border-gold bg-gold/10",
      )}
    >
      <div>
        <p className="text-sm font-medium text-text-primary">{title}</p>
        <p className="mt-1 text-xs leading-5 text-text-muted">{body}</p>
      </div>
      <button
        type="button"
        onClick={() => setStatus(null)}
        className="shrink-0 rounded-md p-1 text-text-muted transition-colors hover:bg-surface hover:text-text-primary"
        aria-label="Dismiss checkout status"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Pro Feature Lock Overlay                                                  */
/* -------------------------------------------------------------------------- */

function ProLockBadge({ featureName }: { featureName: string }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-deep/70 backdrop-blur-[2px]">
      <div className="w-10 h-10 rounded-full bg-gold/10 border border-border-gold flex items-center justify-center">
        <Lock className="w-4 h-4 text-gold" />
      </div>
      <div className="text-center px-4">
        <p className="text-sm font-medium text-text-primary mb-1">
          {featureName}
        </p>
        <p className="text-xs text-text-muted mb-3">
          Available on Pro plan
        </p>
        <Link
          href="/pricing"
          className={cn(
            "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold tracking-[0.03em]",
            "bg-gold-action text-[#060609] hover:bg-gold-actionHover transition-all duration-300",
            "no-underline",
          )}
        >
          Upgrade
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Component                                                            */
/* -------------------------------------------------------------------------- */

export function DashboardPageClient({ planTier = "Free" }: DashboardPageClientProps) {
  const { snapshots, justUpdated, historyByKey } = useIndicatorStream();

  const isPro = planTier === "Pro";

  return (
    <>
      {/* ── Market Header ── */}
      <MarketHeader />

      {/* ── Main Content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 lg:p-6 space-y-5 max-w-[1440px] mx-auto">

          {/* ── Upgrade Banner (Free users only) ── */}
          <CheckoutStatusBanner />

          {!isPro && <UpgradeBanner />}

          <TodayThesis />
          <ThesisTimeline />

          {/* ── XAUUSD Chart ── */}
          <section>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-1 h-5 rounded-full bg-gold" />
              <h2 className="font-display text-lg text-text-primary tracking-[-0.01em]">
                XAUUSD Price Chart
              </h2>
              <span className="text-[12px] tracking-[0.14em] uppercase text-text-muted mt-0.5">
                Verified 4H candles · provider-backed
              </span>
            </div>
            <XauusdChart />
          </section>

          {/* ── Optional technical context ── */}
          <section>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <div className="w-1 h-5 rounded-full bg-gold" />
              <h2 className="font-display text-lg text-text-primary tracking-[-0.01em]">
                Optional Technical Context
              </h2>
              <span className="text-[12px] tracking-[0.14em] uppercase text-text-muted mt-0.5">
                Not part of the thesis score
              </span>
              {isPro && (
                <a
                  href="/api/export/csv"
                  download
                  className="ml-auto flex items-center gap-1.5 rounded-md border border-border-gold/30 px-3 py-1.5 font-mono text-[13px] text-gold no-underline transition-all duration-200 hover:border-border-gold hover:bg-gold/10"
                >
                  <Download className="h-3 w-3" />
                  Export evidence CSV
                </a>
              )}
            </div>
            {snapshots.length === 0 ? (
              <div className="rounded-2xl border border-border bg-surface/60 p-8 text-center">
                <p className="font-display text-xl text-text-primary">
                  No verified technical snapshots yet
                </p>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-text-muted">
                  Run the production ingestion pipeline and verify source health.
                  Dralvo will not fill this surface with simulated market values.
                </p>
              </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {snapshots.map((indicator, i) => {
                // For Free users, only the first 3 indicators are fully accessible
                const isLocked = !isPro && i >= 3;

                return (
                  <div key={indicator.key} className="relative">
                    <IndicatorDetailCard
                      indicator={indicator}
                      history={historyByKey[indicator.key]}
                      justUpdated={justUpdated.has(indicator.key)}
                    />
                    {isLocked && <ProLockBadge featureName={indicator.name} />}
                  </div>
                );
              })}
            </div>
            )}
          </section>

          {/* ── Thesis monitors ── */}
          <section>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-1 h-5 rounded-full bg-gold" />
              <h2 className="font-display text-lg text-text-primary tracking-[-0.01em]">
                Thesis Monitors
              </h2>
              <span className="text-[12px] tracking-[0.14em] uppercase text-text-muted mt-0.5">
                Thesis, driver, and evidence conditions
              </span>
              {!isPro && (
                <span className="text-[12px] text-text-muted flex items-center gap-1 ml-auto">
                  <Lock className="w-3 h-3" />
                  Pro feature
                </span>
              )}
            </div>
            {isPro ? (
              <AlertList />
            ) : (
              <div className="relative rounded-2xl border border-border bg-surface/30 p-8 min-h-[200px] flex items-center justify-center">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gold/10 border border-border-gold flex items-center justify-center">
                    <Lock className="w-5 h-5 text-gold" />
                  </div>
                  <div className="text-center max-w-[320px]">
                    <p className="text-sm font-medium text-text-primary mb-1">
                      Thesis monitors
                    </p>
                    <p className="text-xs text-text-muted mb-4">
                      Monitor thesis state, driver transitions, or numeric
                      evidence thresholds and receive an explanation.
                    </p>
                    <Link
                      href="/pricing"
                      className={cn(
                        "inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-semibold tracking-[0.03em]",
                        "bg-gold-action text-[#060609] hover:bg-gold-actionHover transition-all duration-300",
                        "no-underline",
                      )}
                    >
                      Upgrade to Pro
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ── Notifications & Preferences (Pro only) ── */}
          {isPro && (
            <section>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-1 h-5 rounded-full bg-gold" />
                <h2 className="font-display text-lg text-text-primary tracking-[-0.01em]">
                  Notifications
                </h2>
                <span className="text-[12px] tracking-[0.14em] uppercase text-text-muted mt-0.5">
                  Alert history & channels
                </span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <AlertNotifications />
                <NotificationPreferences />
              </div>
            </section>
          )}

        </div>
      </div>
    </>
  );
}
