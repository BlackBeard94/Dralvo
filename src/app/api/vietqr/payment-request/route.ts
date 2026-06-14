import { NextResponse } from "next/server";

import { checkRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";
import { createVietQrPaymentRequest, getVietQrConfig } from "@/lib/vietqr";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { recordProductEvent } from "@/lib/product-analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const config = getVietQrConfig();
  const reference = new URL(request.url).searchParams
    .get("reference")
    ?.trim()
    .toUpperCase();

  if (reference) {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Payment store unavailable" },
        { status: 503 },
      );
    }

    const { data, error } = await supabase
      .from("vietqr_payment_requests")
      .select("reference,status,confirmed_at,expires_at")
      .eq("user_id", user.id)
      .eq("reference", reference)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Payment request not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, payment: data });
  }

  return NextResponse.json({
    enabled: config.enabled,
    amountVnd: config.proPriceVnd,
    template: config.template,
  });
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimit({
    key: rateLimitKey(request, "vietqr:payment-request"),
    limit: 5,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetAt);
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized. Please sign in first." }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase admin client is not configured." }, { status: 500 });
  }

  try {
    const payment = createVietQrPaymentRequest();
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase.from("vietqr_payment_requests").insert({
      user_id: user.id,
      reference: payment.reference,
      amount_vnd: payment.amountVnd,
      bank_bin: payment.bankBin,
      account_no: payment.accountNo,
      account_name: payment.accountName,
      add_info: payment.addInfo,
      qr_data_url: payment.qrDataUrl,
      qr_code: payment.qrCode,
      status: "pending",
      expires_at: expiresAt,
      metadata: {
        provider: "sepay",
        template: payment.template,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    await recordProductEvent({
      userId: user.id,
      eventName: "vietqr_requested",
      properties: { payment_method: "vietqr" },
    });

    return NextResponse.json({
      ok: true,
      payment: {
        reference: payment.reference,
        amountVnd: payment.amountVnd,
        addInfo: payment.addInfo,
        accountName: payment.accountName,
        accountNo: payment.accountNo,
        bankBin: payment.bankBin,
        qrDataUrl: payment.qrDataUrl,
        expiresAt,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create VietQR payment." },
      { status: 500 },
    );
  }
}
