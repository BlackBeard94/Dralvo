import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import { getPlanDetailsByUserId } from "@/lib/subscription-gate";
import type { PlanDetails, PlanTier } from "@/lib/plan";

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

    // license_keys is not readable by the `authenticated` role under RLS,
    // so resolve through the admin client scoped to this user id.
    return await getPlanDetailsByUserId(user.id);
  } catch {
    // Default to Free when the plan store is unavailable.
    return FREE;
  }
}
