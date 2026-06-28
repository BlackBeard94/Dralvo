import { describe, expect, it } from "vitest";

import { buildLaunchReadinessSummary } from "./launch-readiness";
import type { FreshnessReport } from "@/lib/monitoring/freshness";
import type { ProductAnalyticsSummary } from "@/lib/product-analytics";

const healthyFreshness: FreshnessReport = {
  data_snapshots: {
    status: "failed",
    age_minutes: 1000,
    stale_keys: ["xauusd-rsi"],
    missing_keys: [],
  },
  alert_evaluator: {
    status: "healthy",
    age_minutes: 3,
    last_error: null,
  },
  ingest: {
    status: "healthy",
    age_minutes: 30,
    last_error: null,
  },
  evidence_sources: {
    status: "healthy",
    drivers: {},
  },
  overall: "healthy",
};

const baseAnalytics: ProductAnalyticsSummary = {
  windowDays: 70,
  activeUsers: {
    current7Days: 0,
    previous7Days: 0,
    returningCurrentWeek: 0,
  },
  retention: {
    cohortBasis: "first_observed_event",
    week4: { eligibleUsers: 0, retainedUsers: 0, rate: null },
    week8: { eligibleUsers: 0, retainedUsers: 0, rate: null },
  },
  funnel: {
    dashboard_view: 0,
    monitor_created: 0,
    checkout_started: 0,
    evidence_exported: 0,
  },
  topRoutes: [],
};

describe("buildLaunchReadinessSummary", () => {
  it("does not block launch readiness only because optional snapshots are stale", () => {
    const summary = buildLaunchReadinessSummary({
      freshness: healthyFreshness,
      analytics: {
        ...baseAnalytics,
        activeUsers: { current7Days: 5, previous7Days: 4, returningCurrentWeek: 3 },
        retention: {
          cohortBasis: "first_observed_event",
          week4: { eligibleUsers: 2, retainedUsers: 1, rate: 0.5 },
          week8: { eligibleUsers: 1, retainedUsers: 1, rate: 1 },
        },
        funnel: {
          ...baseAnalytics.funnel,
          checkout_started: 1,
        },
      },
      payment: {
        stripeConfigured: true,
        activePaidSubscriptions: 1,
      },
      now: new Date("2026-06-13T10:00:00Z"),
    });

    expect(summary.overall).toBe("ready");
    expect(summary.items.find((item) => item.key === "data")).toMatchObject({
      status: "ready",
    });
  });

  it("keeps validation in attention until closed cohorts exist", () => {
    const summary = buildLaunchReadinessSummary({
      freshness: { ...healthyFreshness, overall: "delayed" },
      analytics: {
        ...baseAnalytics,
        activeUsers: { current7Days: 3, previous7Days: 1, returningCurrentWeek: 1 },
        funnel: {
          ...baseAnalytics.funnel,
          checkout_started: 1,
        },
      },
      payment: {
        stripeConfigured: true,
        activePaidSubscriptions: 0,
      },
    });

    expect(summary.overall).toBe("attention");
    expect(summary.items.find((item) => item.key === "validation")).toMatchObject({
      status: "attention",
    });
    expect(summary.items.find((item) => item.key === "payments")).toMatchObject({
      status: "attention",
    });
  });
});
