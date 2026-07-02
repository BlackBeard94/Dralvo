/**
 * Server-side partner commission generation — called from the Stripe webhook
 * (and any other paid-event source). A commission is only created when the
 * paying customer is owned by a partner (profiles.referrer_type === 'partner').
 *
 * Single-owner attribution (affiliate XOR partner) is decided once on first
 * touch via profiles.referrer_type/referrer_id; this module never changes it.
 */
import { getSupabaseAdminClient } from "@/lib/supabase/server";

function currentPeriodUtc(): string {
  // 'YYYY-MM' in UTC. Computed per-call (never at module load).
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export interface RecordPartnerCommissionInput {
  customerUserId: string;
  source: "stripe" | "vietqr";
  saleAmount: number; // in major currency units (e.g. dollars)
  currency?: string;
  externalRef: string | null; // stripe invoice id / vietqr ref (idempotency)
}

/**
 * Create a pending partner commission for a paid event, if (and only if) the
 * customer is owned by an active partner. Idempotent on (source, external_ref).
 */
export async function recordPartnerCommission({
  customerUserId,
  source,
  saleAmount,
  currency = "USD",
  externalRef,
}: RecordPartnerCommissionInput): Promise<void> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;
  if (saleAmount <= 0) return;

  // 1) Who owns this customer? Source of truth is profiles.referrer_type/id.
  const { data: profile } = await supabase
    .from("profiles")
    .select("referrer_type, referrer_id")
    .eq("id", customerUserId)
    .single();

  if (!profile || profile.referrer_type !== "partner" || !profile.referrer_id) {
    return; // not a partner customer — no commission
  }

  // 2) Load the partner (must be active) for the current rate snapshot.
  const { data: partner } = await supabase
    .from("partners")
    .select("id, commission_rate, status")
    .eq("id", profile.referrer_id)
    .eq("status", "active")
    .single();

  if (!partner) return; // suspended / missing — skip

  const rate = Number(partner.commission_rate);
  const commissionAmount = round2(saleAmount * rate);

  // 3) Insert the pending commission. Idempotency is enforced by the unique
  //    (source, external_ref) index — swallow duplicate-key errors on retry.
  const { error } = await supabase.from("partner_commissions").insert({
    partner_id: partner.id,
    customer_user_id: customerUserId,
    source,
    sale_amount: saleAmount,
    currency,
    rate,
    commission_amount: commissionAmount,
    period: currentPeriodUtc(),
    status: "pending",
    external_ref: externalRef,
  });

  if (error && error.code !== "23505") {
    // 23505 = unique_violation (webhook retry / duplicate event) — expected.
    console.error("[Partner Commission] Failed to record commission:", error);
  }
}
