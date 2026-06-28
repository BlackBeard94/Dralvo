import { createServerClient } from "@supabase/ssr";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ensureProfile } from "@/lib/supabase/profile";
import { getDashboardPlan } from "@/app/dashboard/get-dashboard-plan";
import { isAdmin } from "@/lib/admin/auth";

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

  // Single source of truth for plan resolution (license_keys + legacy subscriptions).
  const { planTier, planStatus, planSource } = await getDashboardPlan();
  const userIsAdmin = await isAdmin();

  return (
    <DashboardShell
      userEmail={user.email}
      planTier={planTier}
      planStatus={planStatus}
      isAdmin={userIsAdmin}
    >
      {children}
    </DashboardShell>
  );
}
