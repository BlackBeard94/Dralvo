import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import { hasProAccess, planTierForStatus } from "@/lib/stripe-subscriptions";

export async function getDashboardPlanTier() {
  const details = await getDashboardPlan();
  return details.planTier;
}

export async function getDashboardPlan() {
  let planTier = "Free";
  let planStatus = "free";
  let currentPeriodEnd: string | null = null;

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { planTier, planStatus, currentPeriodEnd };

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan_tier, status, current_period_end")
      .eq("user_id", user.id)
      .single();

    if (sub) {
      planStatus = sub.status ?? "free";
      currentPeriodEnd = sub.current_period_end ?? null;
      planTier = hasProAccess(sub.status)
        ? sub.plan_tier
        : planTierForStatus(sub.status);
    }
  } catch {
    // Default to Free.
  }

  return { planTier, planStatus, currentPeriodEnd };
}
