import { createServerClient } from "@supabase/ssr";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ensureProfile } from "@/lib/supabase/profile";
import { hasProAccess, planTierForStatus } from "@/lib/stripe-subscriptions";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // No-op. Layout is read-only and cannot set cookies after render starts.
          // Session refresh is handled by proxy.
        },
      },
    },
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login?redirect=/dashboard");
  }

  await ensureProfile(user);

  let planTier = "Free";
  let planStatus = "free";
  try {
    // ponytail: license_keys takes priority over subscriptions
    const { data: lic } = await supabase
      .from("license_keys")
      .select("plan, expires_at")
      .eq("user_id", user.id)
      .maybeSingle();
    if (lic && (!lic.expires_at || new Date(lic.expires_at) > new Date())) {
      planTier = lic.plan === "unlimited" ? "Unlimited" : "Free";
      planStatus = "active";
    } else {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan_tier, status")
        .eq("user_id", user.id)
        .single();

      if (sub) {
        planStatus = sub.status ?? "free";
        planTier = hasProAccess(sub.status)
          ? sub.plan_tier
          : planTierForStatus(sub.status);
      }
    }
  } catch {}

  return (
    <DashboardShell
      userEmail={user.email}
      planTier={planTier}
      planStatus={planStatus}
    >
      {children}
    </DashboardShell>
  );
}
