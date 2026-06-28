import { describe, expect, it } from "vitest";

import {
  buildProductAnalyticsSummary,
  normalizeDashboardRoute,
  sanitizeEventProperties,
} from "./product-analytics";

describe("product analytics", () => {
  it("accepts dashboard paths but rejects query strings and external paths", () => {
    expect(normalizeDashboardRoute("/dashboard/drivers")).toBe(
      "/dashboard/drivers",
    );
    expect(normalizeDashboardRoute("/dashboard?email=user@example.com")).toBeNull();
    expect(normalizeDashboardRoute("/pricing")).toBeNull();
  });

  it("keeps only approved, bounded metadata", () => {
    expect(
      sanitizeEventProperties({
        locale: "vi",
        payment_method: "stripe",
        email: "private@example.com",
        freeform: { secret: true },
      }),
    ).toEqual({
      locale: "vi",
      payment_method: "stripe",
    });
  });

  it("computes weekly return behavior and conversion events", () => {
    const now = new Date("2026-06-12T12:00:00Z");
    const rows = [
      {
        user_id: "returning",
        event_name: "dashboard_view" as const,
        route_path: "/dashboard",
        occurred_at: "2026-06-02T12:00:00Z",
      },
      {
        user_id: "returning",
        event_name: "dashboard_view" as const,
        route_path: "/dashboard/drivers",
        occurred_at: "2026-06-10T12:00:00Z",
      },
      {
        user_id: "new",
        event_name: "monitor_created" as const,
        route_path: "/dashboard/alerts",
        occurred_at: "2026-06-11T12:00:00Z",
      },
      {
        user_id: "previous",
        event_name: "checkout_started" as const,
        route_path: null,
        occurred_at: "2026-06-03T12:00:00Z",
      },
    ];

    expect(buildProductAnalyticsSummary(rows, now)).toEqual({
      windowDays: 70,
      activeUsers: {
        current7Days: 2,
        previous7Days: 2,
        returningCurrentWeek: 1,
      },
      retention: {
        cohortBasis: "first_observed_event",
        week4: {
          eligibleUsers: 0,
          retainedUsers: 0,
          rate: null,
        },
        week8: {
          eligibleUsers: 0,
          retainedUsers: 0,
          rate: null,
        },
      },
      funnel: {
        dashboard_view: 1,
        monitor_created: 1,
        checkout_started: 1,
        evidence_exported: 0,
      },
      topRoutes: [
        { route: "/dashboard", uniqueUsers: 1, views: 1 },
        { route: "/dashboard/drivers", uniqueUsers: 1, views: 1 },
      ],
    });
  });

  it("computes week-4 and week-8 retention only after each window closes", () => {
    const now = new Date("2026-06-13T00:00:00Z");
    const event = (
      userId: string,
      occurredAt: string,
    ) => ({
      user_id: userId,
      event_name: "dashboard_view" as const,
      route_path: "/dashboard",
      occurred_at: occurredAt,
    });
    const rows = [
      event("retained-8", "2026-03-01T00:00:00Z"),
      event("retained-8", "2026-03-30T00:00:00Z"),
      event("retained-8", "2026-04-27T00:00:00Z"),
      event("lost-8", "2026-03-02T00:00:00Z"),
      event("lost-8", "2026-03-31T00:00:00Z"),
      event("retained-4", "2026-04-20T00:00:00Z"),
      event("retained-4", "2026-05-19T00:00:00Z"),
      event("too-new", "2026-05-25T00:00:00Z"),
    ];

    const summary = buildProductAnalyticsSummary(rows, now);

    expect(summary.retention.week4).toEqual({
      eligibleUsers: 3,
      retainedUsers: 3,
      rate: 1,
    });
    expect(summary.retention.week8).toEqual({
      eligibleUsers: 2,
      retainedUsers: 1,
      rate: 0.5,
    });
  });
});
