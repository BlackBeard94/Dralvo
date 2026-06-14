import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import { hasProAccess, planTierForStatus } from "@/lib/stripe-subscriptions";
import { DashboardPageClient } from "./dashboard-page-client";

export const metadata: Metadata = {
  title: "Dralvo | Gold Decision Intelligence",
  description:
    "Source-backed gold thesis, verified market evidence, and conditions that can change the current view.",
};

export default async function DashboardPage() {
  let planTier = "Free";

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan_tier, status")
        .eq("user_id", user.id)
        .single();

      if (sub) {
        planTier = hasProAccess(sub.status)
          ? sub.plan_tier
          : planTierForStatus(sub.status);
      }
    }
  } catch {
    // Default to Free
  }

  return <DashboardPageClient planTier={planTier} />;
}
