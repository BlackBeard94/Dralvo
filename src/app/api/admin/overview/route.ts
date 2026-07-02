/**
 * GET /api/admin/overview
 * Admin dashboard stats: all-time KPIs + range-scoped activity (new users,
 * new licenses, revenue), license-by-EA breakdown, plan distribution and
 * recent signups / recent licenses.
 *
 * Query params: ?from=YYYY-MM-DD&to=YYYY-MM-DD scope the time-based pieces.
 * When absent, the range defaults to the last 30 days. All-time KPI cards
 * stay all-time regardless of the range.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getAdmin, batchGetEmails } from "@/lib/admin/auth";
import { getStripe } from "@/lib/stripe";

const PRODUCTS = ["goldmaster", "goldscalp", "tigold"] as const;

/** Parse a YYYY-MM-DD (or ISO) param into an ISO string, or null if invalid. */
function parseDate(raw: string | null): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export async function GET(request: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Overview mixes user stats + revenue → gate by permission and only return
  // the slices the caller is allowed to see.
  const isSuper = admin.role === "super_admin";
  const canUsers = isSuper || !!admin.permissions.users?.view;
  const canFinance = isSuper || !!admin.permissions.finance?.view;
  const canAff = isSuper || !!admin.permissions.affiliate?.manage;
  if (!canUsers && !canFinance) {
    return NextResponse.json({ error: "Không có quyền xem tổng quan" }, { status: 403 });
  }

  const client = getSupabaseAdminClient();
  if (!client) return NextResponse.json({ error: "Server config" }, { status: 500 });

  try {
    const url = new URL(request.url);
    const now = new Date();

    // Range for time-scoped metrics. Default: last 30 days.
    const fromISO =
      parseDate(url.searchParams.get("from")) ??
      new Date(now.getTime() - 30 * 86400000).toISOString();
    const toISO = parseDate(url.searchParams.get("to")) ?? now.toISOString();

    const monthStart = new Date(now);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthISO = monthStart.toISOString();
    const nowISO = now.toISOString();

    // ponytail: all counts are independent — parallel
    const [
      { count: totalUsers },
      { count: unlimitedActive },
      { count: tigoldCount },
      { count: stripeActiveSubs },
      { data: activeAmts },
      { count: pendingCommissions },
      // EA breakdown: active (non-expired) keys per product
      { count: gmActive },
      { count: gsActive },
      { count: tgActive },
      // plan distribution proxy (one goldmaster key ≈ one VIP user)
      { count: vipUsers },
      { count: tigoldUsers },
      // range-scoped activity
      { count: newUsersInRange },
      { count: newLicensesInRange },
      { count: newSubsInRange },
      // recent signups + recent licenses
      { data: recentProfiles },
      { data: recentLicenses },
      { data: rangeAmts },
    ] = await Promise.all([
      client.from("profiles").select("*", { count: "exact", head: true }),
      // VIP users hold one unlimited key per EA; count the goldmaster key as a
      // per-user proxy so this stays "≈ number of VIP users", not key count.
      client.from("license_keys").select("*", { count: "exact", head: true }).eq("plan", "unlimited").eq("product", "goldmaster"),
      client.from("license_keys").select("*", { count: "exact", head: true }).eq("plan", "tigold"),
      client.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active").gte("current_period_end", monthISO),
      // Real revenue: sum of amount_usd over active subs (replaces flat ×$59).
      client.from("subscriptions").select("amount_usd").eq("status", "active"),
      client.from("affiliate_commissions").select("*", { count: "exact", head: true }).eq("status", "pending"),
      // active = lifetime OR not yet expired
      client.from("license_keys").select("*", { count: "exact", head: true }).eq("product", "goldmaster").or(`is_lifetime.eq.true,expires_at.gte.${nowISO}`),
      client.from("license_keys").select("*", { count: "exact", head: true }).eq("product", "goldscalp").or(`is_lifetime.eq.true,expires_at.gte.${nowISO}`),
      client.from("license_keys").select("*", { count: "exact", head: true }).eq("product", "tigold").or(`is_lifetime.eq.true,expires_at.gte.${nowISO}`),
      client.from("license_keys").select("*", { count: "exact", head: true }).eq("plan", "unlimited").eq("product", "goldmaster"),
      client.from("license_keys").select("*", { count: "exact", head: true }).eq("plan", "tigold").eq("product", "tigold"),
      client.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", fromISO).lte("created_at", toISO),
      client.from("license_keys").select("*", { count: "exact", head: true }).gte("created_at", fromISO).lte("created_at", toISO),
      client.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active").gte("created_at", fromISO).lte("created_at", toISO),
      client.from("profiles").select("id, created_at").order("created_at", { ascending: false }).limit(8),
      // Latest licenses overall (not range-scoped) — matches the "recent" intent
      // and the recent-signups list above, which is also all-time.
      client.from("license_keys").select("user_id, product, plan, created_at").order("created_at", { ascending: false }).limit(8),
      // Real revenue for the range: sum of amount_usd over active subs created in range.
      client.from("subscriptions").select("amount_usd").eq("status", "active").gte("created_at", fromISO).lte("created_at", toISO),
    ]);

    // Sum stored paid amounts (fallback if Stripe is unreachable below).
    const sumAmt = (rows: { amount_usd: number | null }[] | null) =>
      Math.round((rows ?? []).reduce((s, r) => s + (Number(r.amount_usd) || 0), 0) * 100) / 100;
    let totalRevenue = sumAmt(activeAmts as { amount_usd: number | null }[] | null);
    let rangeRevenue = sumAmt(rangeAmts as { amount_usd: number | null }[] | null);

    // TRUE revenue = all money actually received via Stripe (USD paid invoices),
    // INCLUDING subs that later canceled — not just currently-active subs. Two
    // figures from one paginated pass: all-time total + total within the range.
    // Finance-only cost (skipped for non-finance admins). Falls back to the
    // amount_usd sums above if Stripe is unreachable.
    if (canFinance) {
      try {
        const stripe = getStripe();
        const fromUnix = Math.floor(new Date(fromISO).getTime() / 1000);
        const toUnix = Math.floor(new Date(toISO).getTime() / 1000);
        let allT = 0;
        let rangeT = 0;
        let startingAfter: string | undefined;
        for (let page = 0; page < 30; page++) {
          const batch = await stripe.invoices.list({
            status: "paid",
            limit: 100,
            ...(startingAfter ? { starting_after: startingAfter } : {}),
          });
          for (const inv of batch.data) {
            if ((inv.currency ?? "usd") !== "usd") continue; // USD-only totals
            const amt = (inv.amount_paid ?? 0) / 100;
            allT += amt;
            if (inv.created >= fromUnix && inv.created <= toUnix) rangeT += amt;
          }
          if (!batch.has_more) break;
          startingAfter = batch.data[batch.data.length - 1]?.id;
          if (!startingAfter) break;
        }
        totalRevenue = Math.round(allT * 100) / 100;
        rangeRevenue = Math.round(rangeT * 100) / 100;
      } catch (e) {
        console.error("[Admin Overview] Stripe revenue scan failed — using amount_usd fallback", e);
      }
    }

    // Resolve emails for the user_ids referenced by the recent lists.
    const profileRows = recentProfiles ?? [];
    const licenseRows = recentLicenses ?? [];
    const ids = [
      ...profileRows.map((p) => p.id as string),
      ...licenseRows.map((l) => l.user_id as string | null),
    ].filter((id): id is string => !!id);
    const emails = await batchGetEmails(client, ids);

    const totalUsersN = totalUsers ?? 0;
    const vipN = vipUsers ?? 0;
    const tigoldN = tigoldUsers ?? 0;
    const freeN = Math.max(totalUsersN - vipN - tigoldN, 0);

    return NextResponse.json({
      role: admin.role,
      perms: { users: canUsers, finance: canFinance, affiliate: canAff },
      // --- user stats (users.view) ---
      totalUsers: canUsers ? totalUsersN : null,
      unlimitedActive: canUsers ? (unlimitedActive ?? 0) : null,
      tigoldCount: canUsers ? (tigoldCount ?? 0) : null,
      newUsersInRange: canUsers ? (newUsersInRange ?? 0) : null,
      newLicensesInRange: canUsers ? (newLicensesInRange ?? 0) : null,
      licensesByProduct: canUsers ? {
        goldmaster: gmActive ?? 0,
        goldscalp: gsActive ?? 0,
        tigold: tgActive ?? 0,
      } : null,
      planDistribution: canUsers ? { free: freeN, vip: vipN, tigold: tigoldN } : null,
      recentUsers: canUsers ? profileRows.map((p) => ({
        id: p.id as string,
        email: emails.get(p.id as string) ?? null,
        created_at: p.created_at as string,
      })) : [],
      recentLicenses: canUsers ? licenseRows.map((l) => {
        const uid = (l.user_id as string | null) ?? null;
        return {
          user_id: uid,
          email: uid ? emails.get(uid) ?? null : null,
          product: l.product as string,
          plan: l.plan as string,
          created_at: l.created_at as string,
        };
      }) : [],
      // --- revenue stats (finance.view) ---
      stripeActiveSubs: canFinance ? (stripeActiveSubs ?? 0) : null,
      totalStripeRevenue: canFinance ? totalRevenue : null,
      newSubsInRange: canFinance ? (newSubsInRange ?? 0) : null,
      revenueInRange: canFinance ? rangeRevenue : null,
      // --- affiliate (affiliate.manage) ---
      pendingCommissions: canAff ? (pendingCommissions ?? 0) : null,
      // --- range echo ---
      range: { from: fromISO, to: toISO },
      products: [...PRODUCTS],
    });
  } catch (e) {
    console.error("[Admin Overview]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
