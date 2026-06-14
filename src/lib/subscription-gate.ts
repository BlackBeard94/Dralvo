import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { hasProAccess } from "@/lib/stripe-subscriptions";

export type PlanTier = "Free" | "Pro";

export const PRO_FEATURES = [
  "complete_thesis",
  "all_evidence_drivers",
  "thesis_history",
  "thesis_monitors",
  "historical_replay",
  "csv_export",
] as const;

export type ProFeature = (typeof PRO_FEATURES)[number];

/**
 * Get the current user's plan tier.
 * Returns "Free" if not authenticated or no active Pro subscription found.
 */
export async function getUserPlanTier(): Promise<PlanTier> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return "Free";

  try {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan_tier, status")
      .eq("user_id", user.id)
      .single();

    if (sub && hasProAccess(sub.status) && sub.plan_tier === "Pro") {
      return "Pro";
    }
  } catch {
    // Table may not exist yet — default to Free
  }

  return "Free";
}

export async function getUserPlanTierByUserId(userId: string): Promise<PlanTier> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return "Free";

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan_tier, status")
    .eq("user_id", userId)
    .single();

  if (sub && hasProAccess(sub.status) && sub.plan_tier === "Pro") {
    return "Pro";
  }

  return "Free";
}

/**
 * Check whether the current user has access to a Pro-gated feature.
 * Returns true only if the user has an active Pro subscription.
 */
export async function requireProFeature(
  _feature: ProFeature,
): Promise<boolean> {
  const tier = await getUserPlanTier();
  return tier === "Pro";
}
