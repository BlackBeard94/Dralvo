import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import {
  resolvePlan,
  type PlanDetails,
  type PlanTier,
} from "@/lib/plan";

const FREE: PlanDetails = {
  planTier: "Free",
  planStatus: "free",
  currentPeriodEnd: null,
  planSource: "none",
};

export async function getDashboardPlanTier(): Promise<PlanTier> {
  const details = await getDashboardPlan();
  return details.planTier;
}

export async function getDashboardPlan(): Promise<PlanDetails> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return FREE;

    const [{ data: license }, { data: subscription }] = await Promise.all([
      supabase
        .from("license_keys")
        .select("plan, expires_at")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("subscriptions")
        .select("plan_tier, status, current_period_end, stripe_subscription_id")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    return resolvePlan(license, subscription);
  } catch {
    // Default to Free when the plan store is unavailable.
    return FREE;
  }
}
