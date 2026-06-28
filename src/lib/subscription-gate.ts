import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import {
  isPaidTier,
  resolvePlan,
  type PlanDetails,
  type PlanTier,
} from "@/lib/plan";

export type { PlanTier } from "@/lib/plan";

const FREE_DETAILS: PlanDetails = {
  planTier: "Free",
  planStatus: "free",
  currentPeriodEnd: null,
  planSource: "none",
};

export const PRO_FEATURES = [
  "complete_thesis",
  "all_evidence_drivers",
  "thesis_history",
  "thesis_monitors",
  "historical_replay",
  "csv_export",
] as const;

export type ProFeature = (typeof PRO_FEATURES)[number];

const LICENSE_SELECT = "plan, expires_at";
const SUBSCRIPTION_SELECT =
  "plan_tier, status, current_period_end, stripe_subscription_id";

/**
 * Resolve full plan details for a user id using the admin (service-role)
 * client. The dashboard reads through this because `license_keys` is not
 * readable by the `authenticated` role under RLS — the same path the API
 * enforcement routes already rely on. Reads are scoped to the given user id.
 */
export async function getPlanDetailsByUserId(
  userId: string,
): Promise<PlanDetails> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return FREE_DETAILS;

  const [{ data: license }, { data: subscription }] = await Promise.all([
    supabase.from("license_keys").select(LICENSE_SELECT).eq("user_id", userId).maybeSingle(),
    supabase.from("subscriptions").select(SUBSCRIPTION_SELECT).eq("user_id", userId).maybeSingle(),
  ]);

  return resolvePlan(license, subscription);
}

/**
 * Resolve the plan tier for the current (cookie-authenticated) user.
 * Returns "Free" if not authenticated or no valid paid access found.
 */
export async function getUserPlanTier(): Promise<PlanTier> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return "Free";

    return (await getPlanDetailsByUserId(user.id)).planTier;
  } catch {
    return "Free";
  }
}

/** Resolve the plan tier for an arbitrary user id (uses the admin client). */
export async function getUserPlanTierByUserId(userId: string): Promise<PlanTier> {
  return (await getPlanDetailsByUserId(userId)).planTier;
}

/**
 * Check whether the current user has access to a paid-gated feature.
 * Returns true only if the user has Unlimited access.
 */
export async function requireProFeature(
  _feature: ProFeature,
): Promise<boolean> {
  const tier = await getUserPlanTier();
  return isPaidTier(tier);
}
