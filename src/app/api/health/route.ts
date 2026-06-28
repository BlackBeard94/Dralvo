import { NextResponse } from "next/server";

import { IMPLEMENTED_DRIVER_SOURCE_REGISTRY } from "@/data/driver-registry";
import {
  DRIVER_INDICATOR_KEYS,
  INDICATOR_KEYS,
  INGESTION_CADENCE_MINUTES,
} from "@/data/ingestion";
import { isCronAuthorized } from "@/lib/api-auth";
import { buildFreshnessReport } from "@/lib/monitoring/freshness";
import { checkRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store, max-age=0" };
const REQUIRED_TABLES = [
  "profiles",
  "subscriptions",
  "alerts",
  "indicator_snapshots",
  "alert_notifications",
  "alert_trigger_state",
  "run_logs",
  "evidence_observations",
  "thesis_snapshots",
  "evidence_corrections",
  "product_events",
] as const;

export async function GET(request: Request) {
  const rateLimit = checkRateLimit({
    key: rateLimitKey(request, "health:get"),
    limit: 30,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetAt);
  }

  if (!isCronAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase admin client is not configured" },
      { status: 503 },
    );
  }

  const [
    snapshotResult,
    snapshotCoverageResult,
    activeAlertsResult,
    notificationResult,
    runLogsResult,
    evidenceResult,
    tableResults,
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
      .from("alerts")
      .select("id", { count: "exact", head: true })
      .eq("active", true),
    supabase
      .from("alert_notifications")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("run_logs")
      .select("run_type,status,started_at,finished_at,duration_ms,error,metadata")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("evidence_observations")
      .select("driver_key,series_key,observed_at")
      .in(
        "driver_key",
        IMPLEMENTED_DRIVER_SOURCE_REGISTRY.map((driver) => driver.driverKey),
      )
      .order("observed_at", { ascending: false })
      .limit(500),
    Promise.all(
      REQUIRED_TABLES.map(async (table) => {
        const { error } = await supabase
          .from(table)
          .select("*")
          .limit(1);
        return {
          table,
          ready: !error,
          error: error?.message ?? null,
          code: error?.code ?? null,
          details: error?.details ?? null,
          hint: error?.hint ?? null,
        };
      }),
    ),
  ]);

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

  const env = {
    supabase: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),
    stripe: Boolean(
      process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET,
    ),
    smtp: Boolean(
      process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS,
    ),
    telegram: Boolean(
      process.env.TELEGRAM_BOT_TOKEN &&
        process.env.TELEGRAM_WEBHOOK_SECRET,
    ),
    cron_secret: Boolean(process.env.CRON_SECRET),
    twelve_data: Boolean(process.env.TWELVE_DATA_API_KEY),
    fred: Boolean(process.env.FRED_API_KEY),
    ops_alerts: Boolean(
      process.env.OPS_ALERT_EMAILS ||
        process.env.ADMIN_EMAILS ||
        process.env.OPS_ALERT_TELEGRAM_CHAT_ID,
    ),
    site_url: process.env.NEXT_PUBLIC_SITE_URL ?? null,
  };
  const schemaReady = tableResults.every((table) => table.ready);
  const coreEnvReady =
    env.supabase &&
    env.stripe &&
    env.smtp &&
    env.telegram &&
    env.cron_secret &&
    env.twelve_data &&
    env.fred;

  return NextResponse.json(
    {
      ok: true,
      readiness: {
        ready: schemaReady && coreEnvReady,
        core_env_ready: coreEnvReady,
        schema_ready: schemaReady,
        ops_alerts_ready: env.ops_alerts,
      },
      env,
      schema: {
        required_tables: tableResults,
      },
      data: {
        latest_snapshot: snapshotResult.data ?? null,
        latest_snapshot_error: snapshotResult.error?.message ?? null,
        snapshot_coverage_error: snapshotCoverageResult.error?.message ?? null,
        active_alerts: activeAlertsResult.count ?? 0,
        active_alerts_error: activeAlertsResult.error?.message ?? null,
        latest_notification_at: notificationResult.data?.created_at ?? null,
        latest_notification_error: notificationResult.error?.message ?? null,
        recent_run_logs: runLogsResult.data ?? [],
        recent_run_logs_error: runLogsResult.error?.message ?? null,
        evidence_observations_error: evidenceResult.error?.message ?? null,
        freshness,
      },
    },
    { headers: NO_STORE_HEADERS },
  );
}
