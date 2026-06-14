import { NextResponse } from "next/server";

import { IMPLEMENTED_DRIVER_SOURCE_REGISTRY } from "@/data/driver-registry";
import { INDICATOR_KEYS } from "@/data/ingestion";
import { isCronAuthorized } from "@/lib/api-auth";
import { buildFreshnessReport } from "@/lib/monitoring/freshness";
import {
  buildSourceHealthAlert,
  parseOpsEmailRecipients,
} from "@/lib/monitoring/source-alerts";
import { sendEmail } from "@/lib/notifications/email";
import { sendTelegramMessage } from "@/lib/notifications/telegram";
import { checkRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";
import { recordRunLog } from "@/lib/run-logs";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const startedAt = new Date().toISOString();
  const start = Date.now();
  const rateLimit = checkRateLimit({
    key: rateLimitKey(request, "ops:source-alerts"),
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

  try {
    const [snapshotResult, snapshotCoverageResult, runLogsResult, evidenceResult] =
      await Promise.all([
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
      ]);

    const freshness = buildFreshnessReport({
      latestSnapshotAt: snapshotResult.data?.observed_at ?? null,
      snapshots: snapshotCoverageResult.data ?? [],
      expectedIndicators: INDICATOR_KEYS,
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

    if (freshness.overall === "healthy") {
      await recordRunLog({
        runType: "source_health_alert",
        status: "success",
        startedAt,
        durationMs: Date.now() - start,
        metadata: { overall: freshness.overall, sent: false },
      });
      return NextResponse.json({ ok: true, sent: false, freshness });
    }

    const payload = buildSourceHealthAlert(freshness);
    const emailRecipients = parseOpsEmailRecipients(
      process.env.OPS_ALERT_EMAILS ?? process.env.ADMIN_EMAILS,
    );
    const telegramChatId = process.env.OPS_ALERT_TELEGRAM_CHAT_ID;
    const delivery = {
      email: 0,
      telegram: 0,
    };

    for (const to of emailRecipients) {
      const sent = await sendEmail({
        to,
        subject: payload.subject,
        html: payload.html,
      });
      if (sent) delivery.email++;
    }

    if (telegramChatId) {
      const sent = await sendTelegramMessage(telegramChatId, payload.text);
      if (sent) delivery.telegram++;
    }

    await recordRunLog({
      runType: "source_health_alert",
      status: "success",
      startedAt,
      durationMs: Date.now() - start,
      metadata: {
        overall: freshness.overall,
        sent: true,
        delivery,
      },
    });

    return NextResponse.json({
      ok: true,
      sent: true,
      delivery,
      freshness,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await recordRunLog({
      runType: "source_health_alert",
      status: "error",
      startedAt,
      durationMs: Date.now() - start,
      error: message,
    });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
