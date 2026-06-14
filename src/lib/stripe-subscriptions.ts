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

  const currentPeriodEnd = (subscriptionObject as any).current_period_end
    ? new Date((subscriptionObject as any).current_period_end * 1000).toISOString()
    : null;

  return {
    subscriptionId,
    status: subscriptionObject.status ?? "active",
    currentPeriodEnd,
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
    },
    {
      onConflict: "user_id",
    },
  );

  if (error) {
    throw new Error(`Failed to upsert subscription: ${error.message}`);
  }
}

export async function syncCheckoutSession(sessionId: string, userId: string) {
  const session = await getStripe().checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });

  await upsertProSubscriptionFromCheckoutSession(session, userId);
}
