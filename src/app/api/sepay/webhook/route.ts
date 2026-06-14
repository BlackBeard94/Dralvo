import { NextResponse } from "next/server";

import { checkRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";
import {
  isSepayWebhookAuthorized,
  parseSepayWebhookPayload,
} from "@/lib/sepay";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IGNORED_REASONS = new Set([
  "Only incoming transfers are accepted.",
  "Unexpected bank gateway.",
  "Unexpected destination account.",
  "Dralvo payment reference was not found.",
]);

export async function POST(request: Request) {
  const rateLimit = checkRateLimit({
    key: rateLimitKey(request, "sepay:webhook"),
    limit: 120,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetAt);
  }

  if (!isSepayWebhookAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = parseSepayWebhookPayload(body);

  if (!parsed.ok) {
    if (IGNORED_REASONS.has(parsed.error)) {
      return NextResponse.json({
        success: true,
        ignored: true,
        reason: parsed.error,
      });
    }

    return NextResponse.json(
      { success: false, error: parsed.error },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: "Payment store unavailable" },
      { status: 503 },
    );
  }

  const { payload, reference, transactionAt } = parsed.payment;
  const { data, error } = await supabase.rpc(
    "confirm_sepay_vietqr_payment",
    {
      p_reference: reference,
      p_amount_vnd: payload.transferAmount,
      p_provider_transaction_id: payload.id,
      p_provider_reference_code: payload.referenceCode ?? "",
      p_provider_transaction_at: transactionAt,
      p_provider_payload: payload,
    },
  );

  if (error) {
    console.error("[SePay Webhook] Confirmation failed:", error.message);
    return NextResponse.json(
      { success: false, error: "Payment confirmation failed" },
      { status: 500 },
    );
  }

  const result = Array.isArray(data) ? data[0] : data;
  const status = result?.result ?? "unknown";

  return NextResponse.json({
    success: true,
    status,
    reference,
  });
}
