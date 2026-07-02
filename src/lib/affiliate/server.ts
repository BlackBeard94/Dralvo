/**
 * Server-side affiliate operations — called from API routes and Stripe webhook.
 */
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { recordAdminEvent } from "@/lib/admin/events";
import { notifyUser } from "@/lib/system-notifications";
import { sendEmail } from "@/lib/notifications/email";
import { getAffiliateSettings } from "./settings";
import type { Affiliate, AffiliateCommission, AffiliatePayout, AffiliateReferral, AffiliateStats } from "./types";
import type { PayoutMethod } from "./payout-options";

/** Look up an affiliate by their referral code */
export async function getAffiliateByCode(code: string): Promise<Affiliate | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("affiliates")
    .select("*")
    .eq("code", code)
    .eq("status", "active")
    .single();
  return data as Affiliate | null;
}

/** Look up an affiliate by user_id (for dashboard) */
export async function getAffiliateByUserId(userId: string): Promise<Affiliate | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("affiliates")
    .select("*")
    .eq("user_id", userId)
    .single();
  return data as Affiliate | null;
}

/** Record a click on a referral link */
export async function trackReferralClick(
  affiliateId: string,
  visitorId: string,
  ip: string | null,
  userAgent: string | null,
  landingPage: string | null,
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;
  await supabase.from("affiliate_referrals").insert({
    affiliate_id: affiliateId,
    visitor_id: visitorId,
    ip,
    user_agent: userAgent,
    landing_page: landingPage,
  });
}

/** Mark a referral as converted (user signed up / purchased) */
export async function convertReferral(
  visitorId: string,
  customerId: string,
): Promise<AffiliateReferral | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  // Find the most recent non-converted click for this visitor
  const { data: referral } = await supabase
    .from("affiliate_referrals")
    .select("*")
    .eq("visitor_id", visitorId)
    .eq("converted", false)
    .order("clicked_at", { ascending: false })
    .limit(1)
    .single();

  if (!referral) return null;

  // Check cookie expiry
  const settings = await getAffiliateSettings();
  const clickedAt = new Date(referral.clicked_at).getTime();
  const maxAge = settings.cookie_days * 24 * 60 * 60 * 1000;
  if (Date.now() - clickedAt > maxAge) return null;

  await supabase
    .from("affiliate_referrals")
    .update({ converted: true, converted_at: new Date().toISOString(), customer_id: customerId })
    .eq("id", referral.id);

  return { ...referral, converted: true } as AffiliateReferral;
}

/** Create a commission for a successful payment */
export async function createCommission(
  affiliateId: string,
  referralId: string | null,
  customerId: string | null,
  subscriptionId: string,
  sourceAmountUsd: number,
  periodStart: string | null,
  periodEnd: string | null,
): Promise<AffiliateCommission | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const settings = await getAffiliateSettings();
  if (!settings.program_active) return null;

  const amount = Math.round(sourceAmountUsd * settings.commission_rate * 100) / 100;

  const { data } = await supabase
    .from("affiliate_commissions")
    .insert({
      affiliate_id: affiliateId,
      referral_id: referralId,
      customer_id: customerId,
      subscription_id: subscriptionId,
      amount,
      source_amount: sourceAmountUsd,
      period_start: periodStart,
      period_end: periodEnd,
      status: "pending",
    })
    .select("*")
    .single();

  if (data) {
    // Atomic accrual (avoids read-modify-write races on concurrent invoices).
    await supabase.rpc("increment_affiliate_earned", { p_affiliate_id: affiliateId, p_delta: amount });
  }

  return data as AffiliateCommission | null;
}

/**
 * Record a RECURRING (lifetime) affiliate commission for a paid event — the
 * first payment AND every renewal. The referrer keeps earning as long as the
 * customer they referred keeps paying.
 *
 * Idempotency is per Stripe invoice (external_ref) so the same payment never
 * double-pays, but each new invoice (renewal) creates a fresh commission.
 * Safe to call from the webhook (checkout.session.completed +
 * invoice.payment_succeeded) AND the checkout-success redirect (test mode has
 * no webhook). On success it emails + notifies the referrer.
 */
export async function recordAffiliateCommission(input: {
  customerUserId: string;
  saleAmount: number;
  currency?: string;
  externalRef: string | null; // Stripe invoice id — idempotency key
  subscriptionId?: string;
}): Promise<void> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;
  if (input.saleAmount <= 0) return;
  // Require a stable idempotency key (Stripe invoice id). Without it, a
  // redelivered event or a second code path for the same payment would insert a
  // duplicate commission (the per-invoice unique index can't dedup a null key).
  // Every paid subscription invoice provides one via invoice.payment_succeeded.
  if (!input.externalRef) {
    console.warn("[Affiliate Commission] skipped — no idempotency key (invoice id)");
    return;
  }
  try {
    const settings = await getAffiliateSettings();
    if (!settings.program_active) return;

    // Single-owner attribution (affiliate XOR partner). profiles.referrer_type is
    // the source of truth — set first-touch. A customer can end up with BOTH a
    // partner ownership AND a converted affiliate_referrals row (e.g. clicked a
    // partner link first, then an affiliate link), so we MUST gate on referrer_type
    // here; otherwise the partner AND the affiliate would each be paid on every
    // invoice (double commission out of one sale). Mirrors recordPartnerCommission.
    const { data: profile } = await supabase
      .from("profiles")
      .select("referrer_type, referrer_id")
      .eq("id", input.customerUserId)
      .single();
    if (!profile || profile.referrer_type !== "affiliate" || !profile.referrer_id) {
      return; // this customer is not affiliate-owned → no affiliate commission
    }

    // The referrer must still be an active affiliate. Trust referrer_id (the
    // single-owner record), not just the most-recent converted referral.
    const { data: aff } = await supabase
      .from("affiliates")
      .select("id, user_id, code, total_earned")
      .eq("id", profile.referrer_id)
      .eq("status", "active")
      .single();
    if (!aff) return;

    // The referral row (for reporting) — the converted click for this affiliate.
    const { data: referral } = await supabase
      .from("affiliate_referrals")
      .select("id")
      .eq("customer_id", input.customerUserId)
      .eq("affiliate_id", aff.id)
      .eq("converted", true)
      .order("converted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Block self-referral: an affiliate must not earn commission on their own
    // purchase (or its renewals) — that's a permanent self-discount → cash.
    if (aff.user_id === input.customerUserId) {
      console.warn("[Affiliate Commission] self-referral blocked for", aff.code);
      return;
    }

    // Idempotency: one commission per invoice (skip if this payment is already recorded).
    if (input.externalRef) {
      const { data: existing } = await supabase
        .from("affiliate_commissions")
        .select("id")
        .eq("external_ref", input.externalRef)
        .limit(1);
      if (existing && existing.length > 0) return;
    }

    const amount = Math.round(input.saleAmount * settings.commission_rate * 100) / 100;
    const { error } = await supabase.from("affiliate_commissions").insert({
      affiliate_id: aff.id,
      referral_id: referral?.id ?? null,
      customer_id: input.customerUserId,
      subscription_id: input.subscriptionId ?? "",
      amount,
      source_amount: input.saleAmount,
      status: "pending",
      external_ref: input.externalRef,
    });
    if (error) {
      // 23505 = unique_violation (webhook retry / duplicate event) — expected, no-op.
      if (error.code !== "23505") console.error("[Affiliate Commission] insert:", error);
      return;
    }

    // Bump the affiliate's lifetime total (atomic — race-safe).
    await supabase.rpc("increment_affiliate_earned", { p_affiliate_id: aff.id, p_delta: amount });

    // Tell the referrer they earned (in-app + email). Best-effort.
    await notifyAffiliateOfCommission(supabase, aff.user_id as string, aff.code as string, amount);
  } catch (err) {
    console.error("[Affiliate Commission] Failed:", err);
  }
}

/** Notify + email the referrer that they earned a commission. */
async function notifyAffiliateOfCommission(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  affiliateUserId: string,
  code: string,
  amount: number,
): Promise<void> {
  try {
    await notifyUser(affiliateUserId, {
      title: `+$${amount.toFixed(2)} hoa hồng giới thiệu 🎉`,
      body: "Một khách hàng bạn giới thiệu vừa thanh toán. Hoa hồng đã cộng vào tài khoản affiliate của bạn.",
      level: "success",
      href: "/affiliate",
    });
    const { data: userRes } = await supabase.auth.admin.getUserById(affiliateUserId);
    const email = userRes?.user?.email;
    if (email) {
      await sendEmail({
        to: email,
        subject: `Bạn vừa nhận $${amount.toFixed(2)} hoa hồng giới thiệu — Dralvo`,
        html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#0e1116">Hoa hồng giới thiệu mới 🎉</h2>
          <p>Một khách hàng bạn giới thiệu (mã <b>${code}</b>) vừa thanh toán, và bạn nhận <b>$${amount.toFixed(2)}</b> hoa hồng.</p>
          <p>Với chương trình hoa hồng trọn đời, bạn tiếp tục nhận hoa hồng <b>mỗi lần</b> khách này gia hạn.</p>
          <p><a href="https://www.dralvo.com/affiliate" style="display:inline-block;background:#F0B90B;color:#060609;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Xem bảng affiliate</a></p>
        </div>`,
      });
    }
  } catch (err) {
    console.error("[Affiliate Commission] notify failed:", err);
  }
}

/** Get stats for an affiliate's dashboard */
export async function getAffiliateStats(affiliateId: string): Promise<AffiliateStats> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return { total_clicks: 0, total_conversions: 0, conversion_rate: 0, pending_earnings: 0, total_earned: 0, paid_out: 0, available_for_payout: 0 };
  }

  const [
    { count: total_clicks },
    { count: total_conversions },
    { data: commissions },
  ] = await Promise.all([
    supabase.from("affiliate_referrals").select("*", { count: "exact", head: true }).eq("affiliate_id", affiliateId),
    supabase.from("affiliate_referrals").select("*", { count: "exact", head: true }).eq("affiliate_id", affiliateId).eq("converted", true),
    supabase.from("affiliate_commissions").select("amount,status").eq("affiliate_id", affiliateId),
  ]);

  const pendingEarnings = (commissions ?? [])
    .filter((c) => c.status === "pending")
    .reduce((sum, c) => sum + c.amount, 0);

  const allEarnings = (commissions ?? []).reduce((sum, c) => sum + c.amount, 0);
  const paidOut = (commissions ?? [])
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + c.amount, 0);

  return {
    total_clicks: total_clicks ?? 0,
    total_conversions: total_conversions ?? 0,
    conversion_rate: total_clicks ? ((total_conversions ?? 0) / total_clicks) * 100 : 0,
    pending_earnings: Math.round(pendingEarnings * 100) / 100,
    total_earned: Math.round(allEarnings * 100) / 100,
    paid_out: Math.round(paidOut * 100) / 100,
    available_for_payout: Math.round(pendingEarnings * 100) / 100,
  };
}

/** Get the affiliate's current open (requested/approved) payout, if any */
export async function getOpenPayout(affiliateId: string): Promise<AffiliatePayout | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("affiliate_payouts")
    .select("*")
    .eq("affiliate_id", affiliateId)
    .in("status", ["requested", "approved"])
    .order("requested_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as AffiliatePayout | null) ?? null;
}

type CreatePayoutResult =
  | { ok: true; payout: AffiliatePayout }
  | { ok: false; error: "not_active" | "below_minimum" | "already_requested" | "server_error" };

/**
 * Create a payout request for an affiliate after validating eligibility.
 * `method` is a validated PayoutMethod (VN bank or USDT) — stored JSON-encoded
 * in the `method` column so admin knows where to send the money.
 */
export async function createPayoutRequest(
  affiliate: Affiliate,
  method: PayoutMethod,
): Promise<CreatePayoutResult> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "server_error" };

  if (affiliate.status !== "active") return { ok: false, error: "not_active" };

  const existing = await getOpenPayout(affiliate.id);
  if (existing) return { ok: false, error: "already_requested" };

  const [{ available_for_payout }, settings] = await Promise.all([
    getAffiliateStats(affiliate.id),
    getAffiliateSettings(),
  ]);

  if (available_for_payout < settings.min_payout) {
    return { ok: false, error: "below_minimum" };
  }

  const { data, error } = await supabase
    .from("affiliate_payouts")
    .insert({
      affiliate_id: affiliate.id,
      amount: available_for_payout,
      status: "requested",
      method: JSON.stringify(method),
    })
    .select("*")
    .single();

  if (error || !data) {
    // Unique partial index → concurrent request already open
    return { ok: false, error: error?.code === "23505" ? "already_requested" : "server_error" };
  }

  // Notify the backoffice (bell + chime).
  await recordAdminEvent({
    type: "payout_request",
    title: `Yêu cầu rút tiền: ${affiliate.code}`,
    message: `Số tiền $${Number(available_for_payout).toFixed(2)}`,
    metadata: { affiliateId: affiliate.id, payoutId: data.id, amount: available_for_payout },
  });

  return { ok: true, payout: data as AffiliatePayout };
}

/**
 * Settle a payout marked paid: flip the affiliate's pending commissions to paid,
 * record the actual paid sum on the payout, and bump the affiliate's paid_out.
 * Returns false on misconfiguration.
 */
export async function settlePayoutAsPaid(payoutId: string, adminUserId: string | null): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return false;

  const { data: payout } = await supabase
    .from("affiliate_payouts")
    .select("*")
    .eq("id", payoutId)
    .single();
  if (!payout) return false;
  // Don't re-settle a payout that was already processed (double-pay guard).
  if (payout.status === "paid" || payout.status === "rejected") return false;

  const now = new Date().toISOString();

  // Settle ONLY the commissions that existed when the payout was requested — the
  // amount the admin reviewed. Commissions accrued after the request stay
  // pending for the next payout (prevents over-settling a freshly-grown balance).
  // Filtering on status='pending' also means an already-paid commission is never
  // counted twice into paid_out.
  const { data: pending } = await supabase
    .from("affiliate_commissions")
    .select("id, amount")
    .eq("affiliate_id", payout.affiliate_id)
    .eq("status", "pending")
    .lte("created_at", payout.requested_at);

  const paidSum = Math.round((pending ?? []).reduce((sum, c) => sum + c.amount, 0) * 100) / 100;

  if (pending && pending.length > 0) {
    await supabase
      .from("affiliate_commissions")
      .update({ status: "paid", paid_at: now })
      .in("id", pending.map((c) => c.id));

    const { data: aff } = await supabase
      .from("affiliates")
      .select("paid_out")
      .eq("id", payout.affiliate_id)
      .single();
    await supabase
      .from("affiliates")
      .update({ paid_out: Math.round(((aff?.paid_out ?? 0) + paidSum) * 100) / 100 })
      .eq("id", payout.affiliate_id);
  }

  await supabase
    .from("affiliate_payouts")
    .update({
      status: "paid",
      amount: paidSum,
      processed_at: now,
      processed_by: adminUserId,
    })
    .eq("id", payoutId);

  return true;
}

/** Generate a unique URL-safe referral code from user ID */
export function generateReferralCode(userId: string): string {
  // Use first 8 chars of user ID + 4 random chars for uniqueness
  const base = userId.replace(/-/g, "").slice(0, 8);
  const random = Math.random().toString(36).slice(2, 6);
  return `DR${base}${random}`.toUpperCase();
}
