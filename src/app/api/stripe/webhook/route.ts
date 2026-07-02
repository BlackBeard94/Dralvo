import { NextResponse, type NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe";
import { recordRunLog } from "@/lib/run-logs";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import {
  hasProAccess,
  subscriptionPeriodEndIso,
  upsertProSubscriptionFromCheckoutSession,
} from "@/lib/stripe-subscriptions";
import { recordAffiliateCommission } from "@/lib/affiliate/server";
import { recordPartnerCommission } from "@/lib/partners/commission";
import { sendPurchaseConversions } from "@/lib/marketing/conversions";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  const startedAtMs = Date.now();
  const startedAt = new Date().toISOString();
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not configured.");
    return NextResponse.json(
      { error: "Server configuration error." },
      { status: 500 },
    );
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("[Stripe Webhook] Signature verification failed:", error);
    return NextResponse.json(
      { error: "Invalid signature." },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    console.error("[Stripe Webhook] Supabase admin client not configured.");
    return NextResponse.json(
      { error: "Server configuration error." },
      { status: 500 },
    );
  }

  // Event-level idempotency: Stripe delivers at-least-once, so skip any event id
  // we've already handled (prevents duplicate emails / marketing conversions /
  // admin events on redelivery). Best-effort — if the stripe_events table isn't
  // present yet (migration 20260701130000_release_audit_ddl not applied), we log
  // once and continue without the guard.
  const { error: dedupeErr } = await supabase
    .from("stripe_events")
    .insert({ event_id: event.id, type: event.type });
  if (dedupeErr) {
    if (dedupeErr.code === "23505") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    if (dedupeErr.code !== "42P01") {
      console.error("[Stripe Webhook] dedupe insert failed:", dedupeErr.message, dedupeErr.code);
    }
  }

  // Reverse a still-pending affiliate commission when its sale is refunded.
  // Already-paid commissions need a manual clawback (money left the platform),
  // so we only auto-reverse pending ones and log the rest.
  const cancelAffiliateCommissionForInvoice = async (invoiceId: string | null) => {
    if (!invoiceId) return;
    const { data: comm } = await supabase
      .from("affiliate_commissions")
      .select("id, affiliate_id, amount, status")
      .eq("external_ref", invoiceId)
      .maybeSingle();
    if (!comm) return;
    if (comm.status !== "pending") {
      console.warn(`[Stripe Webhook] refund for already-${comm.status} commission ${comm.id} — manual clawback needed`);
      return;
    }
    await supabase.from("affiliate_commissions").update({ status: "refunded" }).eq("id", comm.id);
    // Atomic decrement (race-safe).
    await supabase.rpc("increment_affiliate_earned", { p_affiliate_id: comm.affiliate_id, p_delta: -Number(comm.amount) });
  };

  // Symmetric reversal for PARTNER commissions on refund. partner_commissions
  // only allows status pending|paid (no 'refunded' state), so a still-pending
  // commission for the refunded invoice is deleted; an already-paid one is left
  // and logged for manual clawback.
  const cancelPartnerCommissionForInvoice = async (invoiceId: string | null) => {
    if (!invoiceId) return;
    const { data: comm } = await supabase
      .from("partner_commissions")
      .select("id, status")
      .eq("source", "stripe")
      .eq("external_ref", invoiceId)
      .maybeSingle();
    if (!comm) return;
    if (comm.status !== "pending") {
      console.warn(`[Stripe Webhook] refund for already-${comm.status} partner commission ${comm.id} — manual clawback needed`);
      return;
    }
    await supabase.from("partner_commissions").delete().eq("id", comm.id);
  };

  try {
    switch (event.type) {
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        // `invoice` is present on subscription charges at runtime but not in the
        // Basil SDK type — read defensively; if absent we simply skip.
        const chargeInvoice = (charge as unknown as {
          invoice?: string | { id?: string } | null;
        }).invoice;
        const invoiceId =
          typeof chargeInvoice === "string" ? chargeInvoice : (chargeInvoice?.id ?? null);
        await cancelAffiliateCommissionForInvoice(invoiceId);
        await cancelPartnerCommissionForInvoice(invoiceId);
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await upsertProSubscriptionFromCheckoutSession(session);

        // Subscription + VIP per-EA licenses are provisioned inside
        // upsertProSubscriptionFromCheckoutSession (shared with the success
        // redirect), so we only handle attribution side-effects here.
        const userId = session.client_reference_id;
        if (userId) {
          // Affiliate commission is recorded from invoice.payment_succeeded
          // (first payment AND renewals) — a single authoritative path keyed on
          // the invoice id. Recording it here too (keyed on the nullable
          // session.invoice) risks a duplicate first-payment commission, so we
          // intentionally do NOT record it in this handler.

          // marketing: fire server-side ad conversions (Meta CAPI / GA4 MP /
          // TikTok Events API). Best-effort — never blocks fulfilment.
          await handleMarketingConversion(userId, session);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        // Fires on the first charge AND every renewal — the hook for RECURRING
        // (lifetime) commissions. Both partner and affiliate customers earn
        // their referrer a commission on every paid invoice.
        const invoice = event.data.object as Stripe.Invoice;
        await handlePartnerCommission(supabase, invoice);
        await handleAffiliateRenewalCommission(supabase, invoice);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeSubscriptionId = subscription.id;
        const status = subscription.status;
        const currentPeriodEnd = subscriptionPeriodEndIso(subscription);

        const { error } = await supabase
          .from("subscriptions")
          .update({
            status,
            plan: hasProAccess(status) ? "pro" : "free",
            plan_tier: hasProAccess(status) ? "Pro" : "Free",
            current_period_end: currentPeriodEnd,
          })
          .eq("stripe_subscription_id", stripeSubscriptionId);

        if (error) {
          console.error(
            "[Stripe Webhook] Failed to update subscription:",
            error,
          );
        }

        // ponytail: sync license expiry on renewal / status change
        const { data: subRow } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", stripeSubscriptionId)
          .single();
        if (subRow) {
          // Extend the VIP (unlimited) rental keys only while access is actually
          // paid. On past_due/unpaid/incomplete etc., expire them immediately so
          // the EA gate (which only checks expires_at) stops the bots — otherwise
          // a delinquent renewal keeps all EAs running free for a full period.
          // Never touch lifetime comps (is_lifetime=true) or tigold-free keys.
          const licenseExpiry = hasProAccess(status)
            ? currentPeriodEnd
            : new Date().toISOString();
          const { error: licErr } = await supabase.from("license_keys")
            .update({ expires_at: licenseExpiry })
            .eq("user_id", subRow.user_id)
            .eq("plan", "unlimited")
            .eq("is_lifetime", false);
          if (licErr) {
            console.error("[Stripe Webhook] Failed to sync license expiry:", licErr);
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeSubscriptionId = subscription.id;

        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            plan: "free",
            plan_tier: "Free",
          })
          .eq("stripe_subscription_id", stripeSubscriptionId);

        if (error) {
          console.error(
            "[Stripe Webhook] Failed to mark subscription as canceled:",
            error,
          );
        }

        // ponytail: revoke license on cancel
        const { data: subRow } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", stripeSubscriptionId)
          .single();
        if (subRow) {
          // Revoke only VIP (unlimited) RENTAL keys; keep tigold-free keys and
          // admin lifetime comps (is_lifetime=true) intact.
          const { error: delErr } = await supabase.from("license_keys")
            .delete()
            .eq("user_id", subRow.user_id)
            .eq("plan", "unlimited")
            .eq("is_lifetime", false);
          if (delErr) {
            console.error("[Stripe Webhook] Failed to revoke licenses on cancel:", delErr);
          }
        }
        break;
      }

      default:
        // Unhandled event type: log for observability but do not fail.
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    await recordRunLog({
      runType: "stripe_webhook",
      status: "success",
      startedAt,
      durationMs: Date.now() - startedAtMs,
      metadata: {
        event_id: event.id,
        event_type: event.type,
      },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Unexpected error:", error);
    await recordRunLog({
      runType: "stripe_webhook",
      status: "error",
      startedAt,
      durationMs: Date.now() - startedAtMs,
      metadata: {
        event_id: event.id,
        event_type: event.type,
      },
      error: error instanceof Error ? error.message : "Webhook processing failed.",
    });
    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 },
    );
  }
}

/**
 * Create a partner (reseller) commission for a paid invoice — on first charge
 * and every renewal. Resolves the local user via the subscriptions table, then
 * defers ownership/rate decisions to recordPartnerCommission (which no-ops for
 * non-partner customers). Idempotent on the Stripe invoice id.
 */
/**
 * Recurring affiliate commission on every paid invoice (first + renewals).
 * Resolves the local user from the invoice's Stripe customer, then defers to
 * recordAffiliateCommission (which no-ops unless the customer was referred by
 * an active affiliate, and dedupes per invoice id).
 */
async function handleAffiliateRenewalCommission(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  invoice: Stripe.Invoice,
) {
  try {
    if (!supabase) return;
    const stripeCustomerId =
      typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id ?? null;
    if (!stripeCustomerId) return;

    const { data: subRow } = await supabase
      .from("subscriptions")
      .select("user_id, stripe_subscription_id")
      .eq("stripe_customer_id", stripeCustomerId)
      .limit(1)
      .single();
    if (!subRow?.user_id) return;

    const amountPaid = (invoice.amount_paid ?? 0) / 100;
    if (amountPaid <= 0) return;

    await recordAffiliateCommission({
      customerUserId: subRow.user_id,
      saleAmount: amountPaid,
      currency: (invoice.currency ?? "usd").toUpperCase(),
      externalRef: invoice.id ?? null,
      subscriptionId: (subRow.stripe_subscription_id as string) ?? "",
    });
  } catch (err) {
    console.error("[Affiliate Commission] renewal failed:", err);
  }
}

async function handlePartnerCommission(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  invoice: Stripe.Invoice,
) {
  try {
    if (!supabase) return;

    const stripeCustomerId =
      typeof invoice.customer === "string"
        ? invoice.customer
        : invoice.customer?.id ?? null;
    if (!stripeCustomerId) return;

    // Resolve the local user from the subscriptions table.
    const { data: subRow } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", stripeCustomerId)
      .limit(1)
      .single();

    if (!subRow?.user_id) return; // no matching local user — skip

    const amountPaid = (invoice.amount_paid ?? 0) / 100; // cents → dollars
    if (amountPaid <= 0) return;

    await recordPartnerCommission({
      customerUserId: subRow.user_id,
      source: "stripe",
      saleAmount: amountPaid,
      currency: (invoice.currency ?? "usd").toUpperCase(),
      externalRef: invoice.id ?? null,
    });
  } catch (err) {
    console.error("[Partner Commission] Failed:", err);
    // Don't fail the webhook — commission is non-critical.
  }
}

/**
 * Fire server-side ad-platform purchase conversions for a completed checkout.
 * Pulls value/currency/email off the Stripe session and uses the session id as
 * the conversion event id so the browser pixels de-duplicate. Best-effort —
 * a tracking failure must not fail the webhook.
 */
async function handleMarketingConversion(
  userId: string,
  session: Stripe.Checkout.Session,
) {
  try {
    const value = (session.amount_total ?? 0) / 100; // cents → currency units
    if (value <= 0 || !session.id) return;

    await sendPurchaseConversions({
      userId,
      email: session.customer_details?.email ?? session.customer_email ?? null,
      value,
      currency: (session.currency ?? "usd").toUpperCase(),
      orderId: session.id,
      sourceUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://dralvo.com",
    });
  } catch (err) {
    console.error("[Marketing Conversion] Failed:", err);
    // Non-critical — never fail the webhook over a tracking call.
  }
}

/** Create affiliate commission if customer was referred */
