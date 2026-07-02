import type Stripe from "stripe";

import { getStripe } from "@/lib/stripe";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export function hasProAccess(status: string | null | undefined) {
  return status === "active" || status === "trialing";
}

export function planTierForStatus(status: string | null | undefined) {
  return hasProAccess(status) ? "Pro" : "Free";
}

export function planStatusLabel(status: string | null | undefined) {
  switch (status) {
    case "active":
      return "Pro";
    case "trialing":
      return "Trialing";
    case "canceled":
      return "Canceled";
    case "past_due":
      return "Past due";
    case "unpaid":
      return "Unpaid";
    case "incomplete":
      return "Incomplete";
    case "incomplete_expired":
      return "Expired";
    default:
      return "Free";
  }
}

function getObjectId(value: string | { id: string } | null) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

const PERIOD_MONTHS: Record<string, number> = {
  monthly: 1,
  sixmo: 6,
  yearly: 12,
};

/**
 * Guaranteed period end derived from the purchased plan period. Used as a
 * fallback so a paid (rental) license never ends up with a null/lifetime
 * expiry. monthly → +1mo, sixmo → +6mo, yearly → +12mo.
 */
export function periodEndFromPlan(
  period: string | null | undefined,
  from: Date = new Date(),
): string {
  const months = PERIOD_MONTHS[period ?? "monthly"] ?? 1;
  const d = new Date(from);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString();
}

/**
 * Read the current period end (unix seconds) from a subscription. Stripe API
 * versions since `basil` (2025) moved `current_period_end` off the subscription
 * root onto the subscription item, so check both.
 */
function subscriptionPeriodEndUnix(sub: Stripe.Subscription): number | null {
  const root = (sub as unknown as { current_period_end?: number })
    .current_period_end;
  const item = sub.items?.data?.[0]?.current_period_end;
  return root ?? item ?? null;
}

/**
 * Resolve a subscription's period end as an ISO string, never null:
 * use Stripe's value when present, otherwise fall back to the plan period
 * from subscription metadata.
 */
export function subscriptionPeriodEndIso(sub: Stripe.Subscription): string {
  const unix = subscriptionPeriodEndUnix(sub);
  if (unix) return new Date(unix * 1000).toISOString();
  return periodEndFromPlan(sub.metadata?.period);
}

async function getSubscriptionDetails(
  subscription: string | Stripe.Subscription | null,
) {
  const subscriptionId = getObjectId(subscription);

  if (!subscriptionId) {
    return {
      subscriptionId: null,
      status: "active",
      currentPeriodEnd: null,
    };
  }

  const subscriptionObject =
    typeof subscription === "string"
      ? await getStripe().subscriptions.retrieve(subscription)
      : subscription;

  if (!subscriptionObject) {
    throw new Error("Stripe subscription could not be retrieved.");
  }

  return {
    subscriptionId,
    status: subscriptionObject.status ?? "active",
    currentPeriodEnd: subscriptionPeriodEndIso(subscriptionObject),
  };
}

export async function upsertProSubscriptionFromCheckoutSession(
  session: Stripe.Checkout.Session,
  expectedUserId?: string,
) {
  const userId = session.client_reference_id;
  const stripeCustomerId = getObjectId(session.customer);

  if (!userId) {
    throw new Error("Checkout session is missing client_reference_id.");
  }

  if (expectedUserId && userId !== expectedUserId) {
    throw new Error("Checkout session does not belong to the signed-in user.");
  }

  if (!stripeCustomerId) {
    throw new Error("Checkout session is missing customer.");
  }

  const { subscriptionId, status, currentPeriodEnd } =
    await getSubscriptionDetails(session.subscription);

  if (!subscriptionId) {
    throw new Error("Checkout session is missing subscription.");
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Supabase admin client is not configured.");
  }

  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      plan: "pro",
      plan_tier: "Pro",
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: subscriptionId,
      status,
      current_period_end: currentPeriodEnd,
      // Real paid price (cents→USD), so revenue reads don't rely on a flat proxy.
      amount_usd: (session.amount_total ?? 0) / 100,
    },
    {
      onConflict: "user_id",
    },
  );

  if (error) {
    throw new Error(`Failed to upsert subscription: ${error.message}`);
  }

  // VIP grants one license key per EA (idempotent). Provisioned HERE so BOTH
  // the Stripe webhook and the checkout-success redirect create the keys — the
  // redirect path is what makes upgrades work when the webhook isn't wired
  // (e.g. Stripe test mode without a forwarded endpoint).
  const expiresAt = currentPeriodEnd ?? periodEndFromPlan(session.metadata?.period);
  const VIP_PRODUCTS: { product: string; max_accounts: number }[] = [
    { product: "goldmaster", max_accounts: 2 },
    { product: "goldscalp", max_accounts: 2 },
    { product: "tigold", max_accounts: 1 },
  ];
  const { error: licenseError } = await supabase.from("license_keys").upsert(
    VIP_PRODUCTS.map((p) => ({
      user_id: userId,
      product: p.product,
      plan: "unlimited",
      is_lifetime: false,
      expires_at: expiresAt,
      max_accounts: p.max_accounts,
    })),
    { onConflict: "user_id,product" },
  );
  if (licenseError) {
    throw new Error(`Failed to provision VIP licenses: ${licenseError.message}`);
  }
}

export async function syncCheckoutSession(sessionId: string, userId: string) {
  const session = await getStripe().checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });

  await upsertProSubscriptionFromCheckoutSession(session, userId);
}
