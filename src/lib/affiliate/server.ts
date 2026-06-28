/**
 * Server-side affiliate operations — called from API routes and Stripe webhook.
 */
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getAffiliateSettings } from "./settings";
import type { Affiliate, AffiliateCommission, AffiliateReferral, AffiliateStats } from "./types";

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
    // Atomically increment affiliate total_earned via direct SQL
    const { data: current } = await supabase
      .from("affiliates")
      .select("total_earned")
      .eq("id", affiliateId)
      .single();
    const newTotal = (current?.total_earned ?? 0) + amount;
    await supabase
      .from("affiliates")
      .update({ total_earned: newTotal })
      .eq("id", affiliateId);
  }

  return data as AffiliateCommission | null;
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

/** Generate a unique URL-safe referral code from user ID */
export function generateReferralCode(userId: string): string {
  // Use first 8 chars of user ID + 4 random chars for uniqueness
  const base = userId.replace(/-/g, "").slice(0, 8);
  const random = Math.random().toString(36).slice(2, 6);
  return `DR${base}${random}`.toUpperCase();
}
