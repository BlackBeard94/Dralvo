import { NextResponse } from "next/server";

import { IMPLEMENTED_DRIVER_SOURCE_REGISTRY } from "@/data/driver-registry";
import {
  DRIVER_INDICATOR_KEYS,
  INDICATOR_KEYS,
  INGESTION_CADENCE_MINUTES,
} from "@/data/ingestion";
import { isAdminEmail } from "@/lib/admin";
import { buildLaunchReadinessSummary } from "@/lib/launch-readiness";
import { buildFreshnessReport } from "@/lib/monitoring/freshness";
import { buildProductAnalyticsSummary } from "@/lib/product-analytics";
import { checkRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store, max-age=0" };

export async function GET(request: Request) {
  const rateLimit = checkRateLimit({
    key: rateLimitKey(request, "ops:launch-readiness:get"),
    limit: 30,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.resetAt);

  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  const eventLimit = 50_000;
  const [
    snapshotResult,
    snapshotCoverageResult,
    runLogsResult,
    evidenceResult,
    productEventsResult,
    activeSubscriptionsResult,
    confirmedVietQrResult,
    pendingVietQrResult,
  ] = await Promise.all([
    supabase
      .from("indicator_snapshots")
      .select("indicator_key, observed_at")
      .order("observed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("indicator_snapshots")
      .select("indicator_key, observed_at")
      .in("indicator_key", INDICATOR_KEYS)
      .order("observed_at", { ascending: false })
      .limit(120),
    supabase
      .from("run_logs")
      .select("run_type,status,started_at,finished_at,duration_ms,error,metadata")
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("evidence_observations")
      .select("driver_key,series_key,observed_at")
      .in(
        "driver_key",
        IMPLEMENTED_DRIVER_SOURCE_REGISTRY.map((driver) => driver.driverKey),
      )
      .order("observed_at", { ascending: false })
      .limit(500),
    supabase
      .from("product_events")
      .select("user_id,event_name,route_path,occurred_at")
      .order("occurred_at", { ascending: false })
      .limit(eventLimit),
    supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .eq("plan_tier", "Pro"),
    supabase
      .from("vietqr_payment_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "confirmed"),
    supabase
      .from("vietqr_payment_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  const queryError =
    snapshotResult.error ??
    snapshotCoverageResult.error ??
    runLogsResult.error ??
    evidenceResult.error ??
    productEventsResult.error ??
    activeSubscriptionsResult.error ??
    confirmedVietQrResult.error ??
    pendingVietQrResult.error;

  if (queryError) {
    return NextResponse.json({ error: queryError.message }, { status: 500 });
  }

  const freshness = buildFreshnessReport({
    latestSnapshotAt: snapshotResult.data?.observed_at ?? null,
    snapshots: snapshotCoverageResult.data ?? [],
    expectedIndicators: INDICATOR_KEYS,
    snapshotExpectations: INDICATOR_KEYS.map((indicatorKey) => {
      const driver = IMPLEMENTED_DRIVER_SOURCE_REGISTRY.find(
        (candidate) =>
          DRIVER_INDICATOR_KEYS[candidate.driverKey] === indicatorKey,
      );
      const cadenceMinutes = INGESTION_CADENCE_MINUTES[indicatorKey] ?? 60;

      return {
        indicatorKey,
        healthyWithinMinutes:
          driver?.healthyWithinMinutes ?? cadenceMinutes * 2,
        delayedWithinMinutes:
          driver?.delayedWithinMinutes ?? cadenceMinutes * 4,
      };
    }),
    evidenceObservations: evidenceResult.data ?? [],
    expectedEvidenceDrivers: IMPLEMENTED_DRIVER_SOURCE_REGISTRY.map((driver) => ({
      driverKey: driver.driverKey,
      requiredSeries: [...driver.requiredSeries],
      healthyWithinMinutes: driver.healthyWithinMinutes,
      delayedWithinMinutes: driver.delayedWithinMinutes,
      methodologyVersion: driver.methodologyVersion,
      sourceUrl: driver.sourceUrl,
    })),
    runLogs: runLogsResult.data ?? [],
  });

  const analytics = buildProductAnalyticsSummary(productEventsResult.data ?? []);
  const summary = buildLaunchReadinessSummary({
    freshness,
    analytics,
    payment: {
      stripeConfigured: Boolean(
        process.env.STRIPE_SECRET_KEY &&
          process.env.STRIPE_WEBHOOK_SECRET &&
          process.env.STRIPE_PRO_PRICE_ID,
      ),
      vietqrConfigured: Boolean(
        process.env.VIETQR_BANK_BIN &&
          process.env.VIETQR_BANK_CODE &&
          process.env.VIETQR_ACCOUNT_NO &&
          process.env.VIETQR_ACCOUNT_NAME &&
          process.env.SEPAY_WEBHOOK_API_KEY,
      ),
      sepayApiConfigured: Boolean(process.env.SEPAY_API_TOKEN),
      activePaidSubscriptions: activeSubscriptionsResult.count ?? 0,
      confirmedVietQrPayments: confirmedVietQrResult.count ?? 0,
      pendingVietQrPayments: pendingVietQrResult.count ?? 0,
    },
  });

  return NextResponse.json(
    {
      ...summary,
      diagnostics: {
        freshness,
        analytics,
        product_event_limit: eventLimit,
        product_events_potentially_truncated:
          (productEventsResult.data?.length ?? 0) === eventLimit,
      },
    },
    { headers: NO_STORE_HEADERS },
  );
}
