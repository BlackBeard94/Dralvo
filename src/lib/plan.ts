// Single source of truth for plan resolution.
// Product model: only two tiers — "Free" and "Unlimited".
// Paid access ("Unlimited") is granted by a valid `license_keys` row.
// Legacy Stripe subscriptions (active/trialing) are grandfathered as Unlimited.

import { hasProAccess } from "@/lib/stripe-subscriptions";

export type PlanTier = "Free" | "Unlimited";

/** Where the user's paid access comes from. */
export type PlanSource = "license" | "subscription" | "none";

export const PAID_TIER: PlanTier = "Unlimited";

/** True when the tier grants full (paid) access. */
export function isPaidTier(tier: string | null | undefined): boolean {
  return tier === PAID_TIER;
}

export interface PlanDetails {
  planTier: PlanTier;
  planStatus: string;
  currentPeriodEnd: string | null;
  planSource: PlanSource;
}

export interface LicenseRow {
  plan: string | null;
  expires_at: string | null;
  /** Lifetime comp (admin-granted). Only such rows may have a null expiry. */
  is_lifetime?: boolean | null;
}

export interface SubscriptionRow {
  plan_tier?: string | null;
  status?: string | null;
  current_period_end?: string | null;
  stripe_subscription_id?: string | null;
}

const FREE_PLAN: PlanDetails = {
  planTier: "Free",
  planStatus: "free",
  currentPeriodEnd: null,
  planSource: "none",
};

/**
 * Resolve plan details from the user's license + subscription rows.
 * Pure function — accepts already-fetched rows so it can be shared by
 * server components (cookie client) and API routes (admin client) alike.
 */
export function resolvePlan(
  license: LicenseRow | null | undefined,
  subscription: SubscriptionRow | null | undefined,
  now: Date = new Date(),
): PlanDetails {
  // A license grants access only if it is an explicit lifetime comp, or it has
  // a concrete expiry still in the future. A null expiry without is_lifetime is
  // treated as invalid so a bug can never produce free-forever access.
  const licenseValid =
    !!license &&
    license.plan === "unlimited" &&
    (license.is_lifetime === true ||
      (!!license.expires_at && new Date(license.expires_at) > now));

  // Stripe subscriptions: trust status (webhook keeps it fresh).
  // Non-Stripe subscriptions (manual / VietQR): also require the period to not
  // have lapsed, so a one-off payment cannot grant indefinite access.
  const isStripeSub = !!subscription?.stripe_subscription_id;
  const subPeriodOk =
    isStripeSub ||
    !subscription?.current_period_end ||
    new Date(subscription.current_period_end) > now;
  const subscriptionActive =
    !!subscription && hasProAccess(subscription.status) && subPeriodOk;

  if (licenseValid || subscriptionActive) {
    const viaStripe = subscriptionActive && isStripeSub;
    return {
      planTier: "Unlimited",
      planStatus: subscriptionActive ? subscription!.status ?? "active" : "active",
      currentPeriodEnd:
        license?.expires_at ?? subscription?.current_period_end ?? null,
      planSource: viaStripe ? "subscription" : "license",
    };
  }

  return {
    ...FREE_PLAN,
    planStatus: subscription?.status ?? "free",
    currentPeriodEnd: subscription?.current_period_end ?? null,
  };
}
