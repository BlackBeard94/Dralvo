import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const PRODUCT_EVENT_NAMES = [
  "dashboard_view",
  "monitor_created",
  "checkout_started",
  "evidence_exported",
] as const;

export type ProductEventName = (typeof PRODUCT_EVENT_NAMES)[number];

type ProductEventRow = {
  user_id: string;
  event_name: ProductEventName;
  route_path: string | null;
  occurred_at: string;
};

export type ProductAnalyticsSummary = {
  windowDays: number;
  activeUsers: {
    current7Days: number;
    previous7Days: number;
    returningCurrentWeek: number;
  };
  retention: {
    cohortBasis: "first_observed_event";
    week4: {
      eligibleUsers: number;
      retainedUsers: number;
      rate: number | null;
    };
    week8: {
      eligibleUsers: number;
      retainedUsers: number;
      rate: number | null;
    };
  };
  funnel: Record<ProductEventName, number>;
  topRoutes: { route: string; uniqueUsers: number; views: number }[];
};

export function isProductEventName(value: unknown): value is ProductEventName {
  return (
    typeof value === "string" &&
    PRODUCT_EVENT_NAMES.includes(value as ProductEventName)
  );
}

export function normalizeDashboardRoute(value: unknown) {
  if (typeof value !== "string") return null;
  const route = value.trim();
  if (
    !route.startsWith("/dashboard") ||
    route.includes("?") ||
    route.includes("#") ||
    route.length > 120
  ) {
    return null;
  }
  return route;
}

export function sanitizeEventProperties(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const input = value as Record<string, unknown>;
  const output: Record<string, string | number | boolean> = {};
  const allowedKeys = new Set(["locale", "target_type", "payment_method"]);

  for (const [key, item] of Object.entries(input)) {
    if (!allowedKeys.has(key)) continue;
    if (
      typeof item === "string" ||
      typeof item === "number" ||
      typeof item === "boolean"
    ) {
      output[key] = typeof item === "string" ? item.slice(0, 80) : item;
    }
  }

  return output;
}

export async function recordProductEvent({
  userId,
  eventName,
  routePath,
  properties,
}: {
  userId: string;
  eventName: ProductEventName;
  routePath?: string | null;
  properties?: unknown;
}) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return false;

  const { error } = await supabase.from("product_events").insert({
    user_id: userId,
    event_name: eventName,
    route_path: routePath ? normalizeDashboardRoute(routePath) : null,
    properties: sanitizeEventProperties(properties),
  });

  if (error) {
    console.error("[Product Analytics] Failed to record event:", error.message);
    return false;
  }

  return true;
}

function uniqueUsers(rows: ProductEventRow[]) {
  return new Set(rows.map((row) => row.user_id)).size;
}

const DAY_MS = 24 * 60 * 60_000;

function retentionAtWeek(
  rows: ProductEventRow[],
  nowMs: number,
  week: 4 | 8,
) {
  const byUser = new Map<string, number[]>();
  for (const row of rows) {
    const occurredAt = Date.parse(row.occurred_at);
    if (!Number.isFinite(occurredAt) || occurredAt > nowMs) continue;
    const events = byUser.get(row.user_id) ?? [];
    events.push(occurredAt);
    byUser.set(row.user_id, events);
  }

  const windowStartDays = week * 7;
  const windowEndDays = windowStartDays + 7;
  let eligibleUsers = 0;
  let retainedUsers = 0;

  for (const events of byUser.values()) {
    events.sort((a, b) => a - b);
    const cohortAt = events[0];
    const completeWindowAt = cohortAt + windowEndDays * DAY_MS;
    if (nowMs < completeWindowAt) continue;

    eligibleUsers += 1;
    const retained = events.some((eventAt) => {
      const ageDays = (eventAt - cohortAt) / DAY_MS;
      return ageDays >= windowStartDays && ageDays < windowEndDays;
    });
    if (retained) retainedUsers += 1;
  }

  return {
    eligibleUsers,
    retainedUsers,
    rate:
      eligibleUsers > 0
        ? Math.round((retainedUsers / eligibleUsers) * 10_000) / 10_000
        : null,
  };
}

export function buildProductAnalyticsSummary(
  rows: ProductEventRow[],
  now = new Date(),
): ProductAnalyticsSummary {
  const nowMs = now.getTime();
  const currentWeekStart = nowMs - 7 * 24 * 60 * 60_000;
  const previousWeekStart = nowMs - 14 * 24 * 60 * 60_000;
  const windowStart = nowMs - 70 * DAY_MS;
  const inRange = (row: ProductEventRow, start: number, end = nowMs) => {
    const time = Date.parse(row.occurred_at);
    return Number.isFinite(time) && time >= start && time < end;
  };

  const currentWeek = rows.filter((row) => inRange(row, currentWeekStart));
  const previousWeek = rows.filter((row) =>
    inRange(row, previousWeekStart, currentWeekStart),
  );
  const priorUsers = new Set(
    rows
      .filter((row) => inRange(row, windowStart, currentWeekStart))
      .map((row) => row.user_id),
  );
  const currentUsers = new Set(currentWeek.map((row) => row.user_id));

  const windowRows = rows.filter((row) => inRange(row, windowStart));
  const funnel = Object.fromEntries(
    PRODUCT_EVENT_NAMES.map((eventName) => [
      eventName,
      uniqueUsers(windowRows.filter((row) => row.event_name === eventName)),
    ]),
  ) as Record<ProductEventName, number>;

  const routeStats = new Map<
    string,
    { views: number; users: Set<string> }
  >();
  for (const row of windowRows) {
    if (row.event_name !== "dashboard_view" || !row.route_path) continue;
    const stats = routeStats.get(row.route_path) ?? {
      views: 0,
      users: new Set<string>(),
    };
    stats.views += 1;
    stats.users.add(row.user_id);
    routeStats.set(row.route_path, stats);
  }

  return {
    windowDays: 70,
    activeUsers: {
      current7Days: currentUsers.size,
      previous7Days: uniqueUsers(previousWeek),
      returningCurrentWeek: [...currentUsers].filter((userId) =>
        priorUsers.has(userId),
      ).length,
    },
    retention: {
      cohortBasis: "first_observed_event",
      week4: retentionAtWeek(rows, nowMs, 4),
      week8: retentionAtWeek(rows, nowMs, 8),
    },
    funnel,
    topRoutes: [...routeStats.entries()]
      .map(([route, stats]) => ({
        route,
        uniqueUsers: stats.users.size,
        views: stats.views,
      }))
      .sort(
        (a, b) =>
          b.uniqueUsers - a.uniqueUsers ||
          b.views - a.views ||
          a.route.localeCompare(b.route),
      )
      .slice(0, 10),
  };
}
