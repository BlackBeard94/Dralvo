/**
 * GET /api/partner/commissions
 * The logged-in partner's commission rows + aggregates.
 * Scoped strictly to the resolved partner.id — never a client-supplied id.
 */
import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getPartner } from "@/lib/partners/auth";
import type { PartnerCommission } from "@/lib/partners/types";

interface PeriodBreakdown {
  period: string;
  saleTotal: number;
  commissionTotal: number;
  count: number;
  // 'paid' only when every row in the period is paid, else 'pending'.
  status: "pending" | "paid";
}

export async function GET() {
  const partner = await getPartner();
  if (!partner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const client = getSupabaseAdminClient();
  if (!client) return NextResponse.json({ error: "Server config" }, { status: 500 });

  try {
    const { data, error } = await client
      .from("partner_commissions")
      .select("*")
      .eq("partner_id", partner.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const commissions = (data ?? []) as PartnerCommission[];

    let totalEarned = 0;
    let pendingTotal = 0;
    let paidTotal = 0;
    const customers = new Set<string>();
    const periodMap = new Map<string, PeriodBreakdown & { allPaid: boolean }>();

    for (const c of commissions) {
      const amount = Number(c.commission_amount) || 0;
      const sale = Number(c.sale_amount) || 0;
      totalEarned += amount;
      if (c.status === "paid") paidTotal += amount;
      else pendingTotal += amount;
      customers.add(c.customer_user_id);

      const entry = periodMap.get(c.period) ?? {
        period: c.period,
        saleTotal: 0,
        commissionTotal: 0,
        count: 0,
        status: "paid" as const,
        allPaid: true,
      };
      entry.saleTotal += sale;
      entry.commissionTotal += amount;
      entry.count += 1;
      if (c.status !== "paid") entry.allPaid = false;
      periodMap.set(c.period, entry);
    }

    const byPeriod: PeriodBreakdown[] = Array.from(periodMap.values())
      .map(({ allPaid, ...rest }) => ({ ...rest, status: allPaid ? ("paid" as const) : ("pending" as const) }))
      .sort((a, b) => b.period.localeCompare(a.period));

    return NextResponse.json({
      commissions,
      aggregates: {
        totalEarned,
        pendingTotal,
        paidTotal,
        customerCount: customers.size,
      },
      byPeriod,
    });
  } catch (e) {
    console.error("[Partner Commissions]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
