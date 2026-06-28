/**
 * GET /api/admin/overview
 * Admin dashboard stats: totals, revenue, active licenses.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/admin/auth";

export async function GET(_request: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = getSupabaseAdminClient();
  if (!client) return NextResponse.json({ error: "Server config" }, { status: 500 });

  try {
    // Total users (auth.users count via profiles table — ponytail: count profiles)
    const { count: totalUsers } = await client
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Unlimited licenses active
    const { count: unlimitedActive } = await client
      .from("license_keys")
      .select("*", { count: "exact", head: true })
      .eq("plan", "unlimited");

    // TiGold licenses
    const { count: tigoldCount } = await client
      .from("license_keys")
      .select("*", { count: "exact", head: true })
      .eq("plan", "tigold");

    // Stripe active subs this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const { count: stripeActiveSubs } = await client
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
      .gte("current_period_end", monthStart.toISOString());

    // Stripe revenue total (all-time active subs × $59)
    const { count: totalStripeActive } = await client
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    // Pending affiliate commissions
    const { count: pendingCommissions } = await client
      .from("affiliate_commissions")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    return NextResponse.json({
      role: admin.role,
      totalUsers: totalUsers ?? 0,
      unlimitedActive: unlimitedActive ?? 0,
      tigoldCount: tigoldCount ?? 0,
      stripeActiveSubs: stripeActiveSubs ?? 0,
      totalStripeRevenue: (totalStripeActive ?? 0) * 59,
      pendingCommissions: pendingCommissions ?? 0,
    });
  } catch (e) {
    console.error("[Admin Overview]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
