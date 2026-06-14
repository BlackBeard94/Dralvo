import { NextResponse } from "next/server";

import { isCronAuthorized } from "@/lib/api-auth";
import { evaluateAndDispatch } from "@/lib/notifications/dispatch";
import { checkRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";
import { recordRunLog } from "@/lib/run-logs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store, max-age=0" };

export async function GET(request: Request) {
  const start = Date.now();
  const startedAt = new Date().toISOString();

  const rateLimit = checkRateLimit({
    key: rateLimitKey(request, "alerts:evaluate"),
    limit: 30,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetAt);
  }

  if (!isCronAuthorized(request)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized", duration_ms: Date.now() - start },
      { status: 401 },
    );
  }

  try {
    const result = await evaluateAndDispatch();
    await recordRunLog({
      runType: "alerts_evaluate",
      status: result.errors.length > 0 ? "error" : "success",
      startedAt,
      durationMs: Date.now() - start,
      metadata: {
        evaluated: result.evaluated,
        triggered: result.triggered,
        dispatched: result.dispatched,
      },
      error: result.errors.length > 0 ? result.errors.join("; ") : null,
    });

    return NextResponse.json(
      {
        ok: true,
        duration_ms: Date.now() - start,
        ...result,
      },
      { headers: NO_STORE_HEADERS },
    );
  } catch (err) {
    console.error("[alerts/evaluate] Fatal error:", err);
    await recordRunLog({
      runType: "alerts_evaluate",
      status: "error",
      startedAt,
      durationMs: Date.now() - start,
      error: err instanceof Error ? err.message : "Unknown error",
    });
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Unknown error",
        duration_ms: Date.now() - start,
      },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
