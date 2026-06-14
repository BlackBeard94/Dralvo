import { NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/admin";
import { checkRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ConfirmBody = {
  reference?: string;
};

export async function POST(request: Request) {
  const rateLimit = checkRateLimit({
    key: rateLimitKey(request, "vietqr:confirm"),
    limit: 20,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetAt);
  }

  const admin = await getAuthenticatedUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdminEmail(admin.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as ConfirmBody;
  const reference = body.reference?.trim().toUpperCase();

  if (!reference) {
    return NextResponse.json({ error: "reference is required" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase admin client is not configured." }, { status: 500 });
  }

  const { data: payment, error: paymentError } = await supabase
    .from("vietqr_payment_requests")
    .select("id,user_id,status")
    .eq("reference", reference)
    .single();

  if (paymentError || !payment) {
    return NextResponse.json({ error: "Payment request not found." }, { status: 404 });
  }

  if (payment.status !== "pending") {
    return NextResponse.json(
      { error: `Payment request is already ${payment.status}.` },
      { status: 409 },
    );
  }

  const now = new Date().toISOString();
  const currentPeriodEnd = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const { error: updatePaymentError } = await supabase
    .from("vietqr_payment_requests")
    .update({
      status: "confirmed",
      confirmed_by: admin.id,
      confirmed_at: now,
      updated_at: now,
    })
    .eq("id", payment.id);

  if (updatePaymentError) {
    return NextResponse.json({ error: updatePaymentError.message }, { status: 500 });
  }

  const { error: subscriptionError } = await supabase.from("subscriptions").upsert(
    {
      user_id: payment.user_id,
      plan: "pro",
      plan_tier: "Pro",
      status: "active",
      current_period_end: currentPeriodEnd,
      updated_at: now,
    },
    {
      onConflict: "user_id",
    },
  );

  if (subscriptionError) {
    return NextResponse.json({ error: subscriptionError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    reference,
    userId: payment.user_id,
    status: "confirmed",
  });
}
