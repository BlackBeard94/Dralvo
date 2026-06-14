import { NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/admin";
import { checkRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type CorrectionBody = {
  observationId?: unknown;
  correctedNumericValue?: unknown;
  reason?: unknown;
  sourceUrl?: unknown;
  metadata?: unknown;
};

function validateCorrection(body: CorrectionBody) {
  const observationId =
    typeof body.observationId === "string" ? body.observationId.trim() : "";
  const correctedNumericValue =
    typeof body.correctedNumericValue === "number"
      ? body.correctedNumericValue
      : Number.NaN;
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  const sourceUrl =
    typeof body.sourceUrl === "string" ? body.sourceUrl.trim() : "";

  if (!UUID_PATTERN.test(observationId)) {
    return { error: "A valid observationId is required." } as const;
  }
  if (!Number.isFinite(correctedNumericValue)) {
    return { error: "correctedNumericValue must be finite." } as const;
  }
  if (reason.length < 10 || reason.length > 500) {
    return { error: "reason must contain 10 to 500 characters." } as const;
  }
  if (sourceUrl) {
    try {
      const parsed = new URL(sourceUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
    } catch {
      return { error: "sourceUrl must be an HTTP(S) URL." } as const;
    }
  }

  const metadata =
    body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
      ? body.metadata
      : {};

  return {
    value: {
      observationId,
      correctedNumericValue,
      reason,
      sourceUrl: sourceUrl || null,
      metadata,
    },
  } as const;
}

type AuthenticatedUser = NonNullable<
  Awaited<ReturnType<typeof getAuthenticatedUser>>
>;

async function requireAdmin(): Promise<
  { user: AuthenticatedUser } | { response: NextResponse }
> {
  const user = await getAuthenticatedUser();
  if (!user) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!isAdminEmail(user.email)) {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user };
}

export async function GET(request: Request): Promise<NextResponse> {
  const rateLimit = checkRateLimit({
    key: rateLimitKey(request, "ops:evidence-corrections:get"),
    limit: 30,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.resetAt);

  const auth = await requireAdmin();
  if (!("user" in auth)) return auth.response;

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("evidence_corrections")
    .select(
      "id,evidence_observation_id,source_key,driver_key,series_key,observed_at,previous_numeric_value,corrected_numeric_value,unit,correction_reason,correction_source_url,detected_at,applied_by,created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ corrections: data ?? [] });
}

export async function POST(request: Request): Promise<NextResponse> {
  const rateLimit = checkRateLimit({
    key: rateLimitKey(request, "ops:evidence-corrections:post"),
    limit: 10,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.resetAt);

  const auth = await requireAdmin();
  if (!("user" in auth)) return auth.response;

  const validation = validateCorrection(
    ((await request.json().catch(() => ({}))) ?? {}) as CorrectionBody,
  );
  if ("error" in validation) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  const { value } = validation;
  const { data, error } = await supabase.rpc("apply_evidence_correction", {
    p_observation_id: value.observationId,
    p_corrected_numeric_value: value.correctedNumericValue,
    p_correction_reason: value.reason,
    p_correction_source_url: value.sourceUrl,
    p_correction_metadata: value.metadata,
    p_applied_by: auth.user.id,
  });

  if (error) {
    const status = /not found/i.test(error.message) ? 404 : 409;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json({ ok: true, observation: data });
}
