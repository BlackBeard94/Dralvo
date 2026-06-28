import type { FreshnessReport } from "@/lib/monitoring/freshness";
import type { ProductAnalyticsSummary } from "@/lib/product-analytics";

export type LaunchReadinessStatus = "ready" | "attention" | "blocked";

export type LaunchReadinessItem = {
  key: "data" | "scheduler" | "payments" | "validation";
  label: string;
  status: LaunchReadinessStatus;
  detail: string;
  evidence: string[];
};

export type LaunchReadinessSummary = {
  generatedAt: string;
  overall: LaunchReadinessStatus;
  items: LaunchReadinessItem[];
};

type BuildLaunchReadinessInput = {
  freshness: FreshnessReport;
  analytics: ProductAnalyticsSummary;
  payment: {
    stripeConfigured: boolean;
    activePaidSubscriptions: number;
  };
  now?: Date;
};

function worstLaunchStatus(
  statuses: LaunchReadinessStatus[],
): LaunchReadinessStatus {
  if (statuses.includes("blocked")) return "blocked";
  if (statuses.includes("attention")) return "attention";
  return "ready";
}

function dataItem(freshness: FreshnessReport): LaunchReadinessItem {
  const status = freshness.overall === "failed" || freshness.overall === "unknown"
    ? "blocked"
    : freshness.overall === "delayed"
      ? "attention"
      : "ready";

  return {
    key: "data",
    label: "Evidence data",
    status,
    detail:
      status === "ready"
        ? "Core evidence sources are fresh enough for production display."
        : status === "attention"
          ? "Core evidence is usable, but at least one source is delayed by cadence or publication timing."
          : "A required evidence source is failed or unknown.",
    evidence: [
      `overall freshness: ${freshness.overall}`,
      `evidence sources: ${freshness.evidence_sources.status}`,
      `snapshot status: ${freshness.data_snapshots.status}`,
    ],
  };
}

function schedulerItem(freshness: FreshnessReport): LaunchReadinessItem {
  const blocked =
    freshness.alert_evaluator.status === "failed" ||
    freshness.alert_evaluator.status === "unknown" ||
    freshness.ingest.status === "failed" ||
    freshness.ingest.status === "unknown";
  const attention =
    freshness.alert_evaluator.status === "delayed" ||
    freshness.ingest.status === "delayed";
  const status = blocked ? "blocked" : attention ? "attention" : "ready";

  return {
    key: "scheduler",
    label: "Schedulers",
    status,
    detail:
      status === "ready"
        ? "Alert evaluation and ingest have recent successful run logs."
        : status === "attention"
          ? "Scheduler logs are present, but one job is delayed."
          : "A required scheduler job is missing, unknown, or failed.",
    evidence: [
      `alert evaluator: ${freshness.alert_evaluator.status} (${freshness.alert_evaluator.age_minutes ?? "n/a"} min)`,
      `ingest: ${freshness.ingest.status} (${freshness.ingest.age_minutes ?? "n/a"} min)`,
    ],
  };
}

function paymentItem(
  payment: BuildLaunchReadinessInput["payment"],
): LaunchReadinessItem {
  const configured = payment.stripeConfigured;
  const hasRealPaymentEvidence = payment.activePaidSubscriptions > 0;
  const status = !configured
    ? "blocked"
    : hasRealPaymentEvidence
      ? "ready"
      : "attention";

  return {
    key: "payments",
    label: "Payment rails",
    status,
    detail:
      status === "ready"
        ? "Stripe is configured and at least one paid activation exists."
        : status === "attention"
          ? "Payment rails are configured, but a real paid activation still needs to be verified."
          : "A required Stripe configuration value is missing.",
    evidence: [
      `stripe configured: ${payment.stripeConfigured}`,
      `active paid subscriptions: ${payment.activePaidSubscriptions}`,
    ],
  };
}

function validationItem(
  analytics: ProductAnalyticsSummary,
): LaunchReadinessItem {
  const hasUsage = analytics.activeUsers.current7Days > 0;
  const hasClosedRetention =
    analytics.retention.week4.eligibleUsers > 0 ||
    analytics.retention.week8.eligibleUsers > 0;
  const hasConversionIntent = analytics.funnel.checkout_started > 0;
  const status = hasUsage && hasClosedRetention && hasConversionIntent
    ? "ready"
    : hasUsage || hasConversionIntent
      ? "attention"
      : "blocked";

  return {
    key: "validation",
    label: "Paid validation",
    status,
    detail:
      status === "ready"
        ? "Usage, conversion intent, and closed retention windows are available for review."
        : status === "attention"
          ? "Some validation signals exist, but closed retention and/or conversion evidence is incomplete."
          : "No meaningful product validation signal has been recorded yet.",
    evidence: [
      `7-day active users: ${analytics.activeUsers.current7Days}`,
      `checkout intent users: ${analytics.funnel.checkout_started}`,
      `week 4 eligible users: ${analytics.retention.week4.eligibleUsers}`,
      `week 8 eligible users: ${analytics.retention.week8.eligibleUsers}`,
    ],
  };
}

export function buildLaunchReadinessSummary({
  freshness,
  analytics,
  payment,
  now = new Date(),
}: BuildLaunchReadinessInput): LaunchReadinessSummary {
  const items = [
    dataItem(freshness),
    schedulerItem(freshness),
    paymentItem(payment),
    validationItem(analytics),
  ];

  return {
    generatedAt: now.toISOString(),
    overall: worstLaunchStatus(items.map((item) => item.status)),
    items,
  };
}
