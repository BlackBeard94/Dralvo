"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Clock3,
  DatabaseZap,
  ExternalLink,
  Lock,
  ShieldAlert,
} from "lucide-react";

import { AlertList } from "@/components/dashboard/alert-list";
import { AlertNotifications } from "@/components/dashboard/alert-notifications";
import { BillingPanel } from "@/components/dashboard/billing-panel";
import { CorrelationMatrix } from "@/components/dashboard/correlation-matrix";
import { IndicatorDetailCard } from "@/components/dashboard/indicator-detail-card";
import { MarketHeader } from "@/components/dashboard/market-header";
import { NotificationPreferences } from "@/components/dashboard/notification-preferences";
import { ProductAnalyticsPanel } from "@/components/dashboard/product-analytics-panel";
import { RunLogsPanel } from "@/components/dashboard/run-logs-panel";
import { XauusdChart } from "@/components/dashboard/xauusd-chart";
import { DriverHistoryPanel } from "@/components/dashboard/driver-history-panel";
import { IMPLEMENTED_DRIVER_SOURCE_REGISTRY } from "@/data/driver-registry";
import { useIndicatorStream } from "@/hooks/use-indicator-stream";
import { useLocale } from "@/hooks/use-locale";
import { DASHBOARD_COPY } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5 flex flex-col gap-2">
      <span className="text-[10px] uppercase tracking-[0.18em] text-gold">
        {eyebrow}
      </span>
      <h1 className="font-display text-3xl text-text-primary tracking-[-0.02em]">
        {title}
      </h1>
      <p className="max-w-2xl text-sm leading-6 text-text-muted">
        {description}
      </p>
    </div>
  );
}

function UpgradePanel({ title, description }: { title: string; description: string }) {
  const { locale } = useLocale();
  const copy = DASHBOARD_COPY[locale].pages;

  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border-gold bg-gold/10">
        <Lock className="h-5 w-5 text-gold" />
      </div>
      <h2 className="font-display text-xl text-text-primary">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-muted">
        {description}
      </p>
      <Link
        href="/pricing"
        className={cn(
          "mt-5 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-semibold no-underline",
          "bg-gold-action text-[#060609] hover:bg-gold-actionHover",
        )}
      >
        {copy.upgrade}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

export function ChartPage() {
  const { locale } = useLocale();
  const copy = DASHBOARD_COPY[locale].pages;

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <MarketHeader />
      <PageHeader
        eyebrow={copy.chartEyebrow}
        title={copy.chartTitle}
        description={copy.chartDescription}
      />
      <XauusdChart />
    </div>
  );
}

export function IndicatorsPage({ planTier = "Free" }: { planTier?: string }) {
  const { locale } = useLocale();
  const copy = DASHBOARD_COPY[locale].pages;
  const { snapshots, justUpdated, historyByKey } = useIndicatorStream();
  const isPro = planTier === "Pro";

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <PageHeader
        eyebrow={copy.indicatorsEyebrow}
        title={copy.indicatorsTitle}
        description={copy.indicatorsDescription}
      />
      {snapshots.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface/60 p-8 text-center">
          <h2 className="font-display text-xl text-text-primary">
            {copy.noSnapshots}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-text-muted">
            {copy.noSnapshotsDescription}
          </p>
        </div>
      ) : (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {snapshots.map((indicator, index) => {
          const locked = !isPro && index >= 3;

          return (
            <div key={indicator.key} className="relative">
              <IndicatorDetailCard
                indicator={indicator}
                history={historyByKey[indicator.key]}
                justUpdated={justUpdated.has(indicator.key)}
              />
              {locked && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-deep/75 p-5 backdrop-blur-[2px]">
                  <UpgradePanel
                    title={indicator.name}
                    description={copy.proIndicatorDescription}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}

export function DriversPage() {
  const { locale } = useLocale();
  const copy = DASHBOARD_COPY[locale].drivers;

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        {IMPLEMENTED_DRIVER_SOURCE_REGISTRY.map((driver) => (
          <article
            key={driver.driverKey}
            className="rounded-2xl border border-border bg-surface p-5 md:p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="rounded-lg border border-border-gold bg-gold/10 p-2 text-gold">
                  <DatabaseZap className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-text-muted">
                    {driver.methodologyVersion}
                  </p>
                  <h2 className="mt-1 font-display text-xl text-text-primary">
                    {driver.label}
                  </h2>
                </div>
              </div>
              <span className="rounded-full border border-green/30 bg-green/5 px-2.5 py-1 text-[9px] uppercase tracking-wider text-green">
                {copy.implemented}
              </span>
            </div>

            <div className="mt-5 rounded-xl border border-border bg-card p-4">
              <p className="text-[9px] uppercase tracking-[0.16em] text-gold">
                {copy.decisionQuestion}
              </p>
              <p className="mt-2 text-sm leading-6 text-text-primary">
                {driver.decisionQuestion}
              </p>
            </div>

            <dl className="mt-5 grid gap-4 text-sm">
              <div>
                <dt className="text-[10px] uppercase tracking-wider text-text-muted">
                  {copy.interpretation}
                </dt>
                <dd className="mt-1 leading-6 text-text-secondary">
                  {driver.relationship}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-text-muted">
                  <ShieldAlert className="h-3.5 w-3.5 text-gold" />
                  {copy.limitations}
                </dt>
                <dd className="mt-1 leading-6 text-text-secondary">
                  {driver.limitations}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-text-muted">
                  <Clock3 className="h-3.5 w-3.5 text-gold" />
                  {copy.cadence}
                </dt>
                <dd className="mt-1 text-text-secondary">{driver.cadence}</dd>
              </div>
            </dl>

            <div className="mt-5 border-t border-border pt-4">
              <p className="text-[10px] uppercase tracking-wider text-text-muted">
                {copy.requiredSeries}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {driver.requiredSeries.map((series) => (
                  <code
                    key={series}
                    className="rounded-md border border-border bg-card px-2 py-1 text-[10px] text-text-secondary"
                  >
                    {series}
                  </code>
                ))}
              </div>
              <a
                href={driver.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-xs text-gold no-underline hover:text-gold-bright"
              >
                {copy.openSource}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            {driver.driverKey === "cftc-gold-positioning" && (
              <DriverHistoryPanel
                driverKey="cftc-gold-positioning"
                variant="cftc"
              />
            )}
            {driver.driverKey === "gld-gold-holdings" && (
              <DriverHistoryPanel
                driverKey="gld-gold-holdings"
                variant="gld"
              />
            )}
            {driver.driverKey === "tips-real-yield" && (
              <DriverHistoryPanel
                driverKey="tips-real-yield"
                variant="tips"
              />
            )}
            {driver.driverKey === "xauusd-price-context" && (
              <DriverHistoryPanel
                driverKey="xauusd-price-context"
                variant="xauusd"
              />
            )}
            {driver.driverKey === "comex-gold-inventory" && (
              <div className="mt-5 rounded-xl border border-border bg-card px-4 py-3">
                <p className="text-[9px] uppercase tracking-[0.16em] text-gold">
                  {copy.comexHistoryTitle}
                </p>
                <p className="mt-2 text-xs leading-5 text-text-muted">
                  {copy.comexHistoryDetail}
                </p>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

export function CorrelationPage({ planTier = "Free" }: { planTier?: string }) {
  const { locale } = useLocale();
  const copy = DASHBOARD_COPY[locale].pages;
  const isPro = planTier === "Pro";

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <PageHeader
        eyebrow={copy.correlationEyebrow}
        title={copy.correlationTitle}
        description={copy.correlationDescription}
      />
      <div className="relative">
        <CorrelationMatrix />
        {!isPro && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-deep/75 p-5 backdrop-blur-[2px]">
            <UpgradePanel
              title={copy.correlationLockedTitle}
              description={copy.correlationLockedDescription}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function AlertsPage({ planTier = "Free" }: { planTier?: string }) {
  const { locale } = useLocale();
  const copy = DASHBOARD_COPY[locale].pages;
  const isPro = planTier === "Pro";

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <PageHeader
        eyebrow={copy.alertsEyebrow}
        title={copy.alertsTitle}
        description={copy.alertsDescription}
      />
      {isPro ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
          <AlertList />
          <AlertNotifications />
        </div>
      ) : (
        <UpgradePanel
          title={copy.alertsLockedTitle}
          description={copy.alertsLockedDescription}
        />
      )}
    </div>
  );
}

export function SettingsPage({
  planTier = "Free",
  planStatus = "free",
  currentPeriodEnd = null,
}: {
  planTier?: string;
  planStatus?: string;
  currentPeriodEnd?: string | null;
}) {
  const isPro = planTier === "Pro";
  const { locale } = useLocale();
  const copy = DASHBOARD_COPY[locale].pages;

  return (
    <div className="mx-auto max-w-[960px] space-y-5">
      <PageHeader
        eyebrow={copy.settingsEyebrow}
        title={copy.settingsTitle}
        description={copy.settingsDescription}
      />

      <div className="grid gap-4">
        <BillingPanel
          planTier={planTier}
          planStatus={planStatus}
          currentPeriodEnd={currentPeriodEnd}
        />

        {isPro ? (
          <NotificationPreferences />
        ) : (
          <div className="rounded-2xl border border-border bg-surface/60 p-5">
            <div className="mb-3 flex items-center gap-2">
              <Bell className="h-4 w-4 text-gold" />
              <h2 className="font-display text-lg text-text-primary">
                {copy.notifications}
              </h2>
            </div>
            <p className="text-sm text-text-muted">
              {copy.notificationsLocked}
            </p>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-surface/60 p-5">
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-gold" />
            <h2 className="font-display text-lg text-text-primary">
              {copy.dataStatus}
            </h2>
          </div>
          <p className="text-sm text-text-muted">
            {copy.dataStatusDescription}
          </p>
        </div>

        <RunLogsPanel />
        <ProductAnalyticsPanel />
      </div>
    </div>
  );
}
