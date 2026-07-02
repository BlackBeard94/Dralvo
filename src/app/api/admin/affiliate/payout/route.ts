/**
 * GET/POST /api/admin/affiliate/payout
 * Admin: list pending commissions, mark as paid, manage affiliates.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getAdmin, can } from "@/lib/admin/auth";
import { settlePayoutAsPaid } from "@/lib/affiliate/server";
import type { AffiliateWithUser, AffiliateCommission, AffiliatePayoutWithUser } from "@/lib/affiliate/types";

export async function GET(request: NextRequest) {
  const admin = await getAdmin();
  if (!admin || !can(admin, "affiliate.manage")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const url = new URL(request.url);
  const action = url.searchParams.get("action") ?? "commissions";

  if (action === "payouts") {
    // List payout requests (newest first) joined with affiliate code + email
    const { data: payouts } = await supabase
      .from("affiliate_payouts")
      .select("*, affiliates(code, user_id)")
      .order("requested_at", { ascending: false })
      .limit(100);

    const withUser: AffiliatePayoutWithUser[] = [];
    for (const p of payouts ?? []) {
      const aff = (p as { affiliates?: { code: string; user_id: string } }).affiliates;
      let email: string | null = null;
      if (aff?.user_id) {
        const { data: authUser } = await supabase.auth.admin.getUserById(aff.user_id);
        email = authUser?.user?.email ?? null;
      }
      withUser.push({ ...p, affiliate_code: aff?.code ?? null, user_email: email } as AffiliatePayoutWithUser);
    }

    return NextResponse.json({ payouts: withUser });
  }

  if (action === "affiliates") {
    // List all affiliates with user emails
    const { data: affiliates } = await supabase
      .from("affiliates")
      .select("*")
      .order("created_at", { ascending: false });

    // Fetch user emails
    const withEmails: AffiliateWithUser[] = [];
    if (affiliates) {
      for (const a of affiliates) {
        const { data: authUser } = await supabase.auth.admin.getUserById(a.user_id);
        withEmails.push({ ...a, user_email: authUser?.user?.email ?? null } as AffiliateWithUser);
      }
    }

    return NextResponse.json({ affiliates: withEmails });
  }

  // Default: list recent commissions (all statuses) with customer + affiliate detail
  const { data: commissions } = await supabase
    .from("affiliate_commissions")
    .select("*, affiliates(code)")
    .order("created_at", { ascending: false })
    .limit(100);

  // Resolve customer emails in one listUsers call (max 1000), then map.
  const { data: usersPage } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const emailById = new Map((usersPage?.users ?? []).map((u) => [u.id, u.email ?? null]));

  const enriched: AffiliateCommission[] = (commissions ?? []).map((c) => {
    const aff = (c as { affiliates?: { code: string } }).affiliates;
    return {
      ...c,
      customer_email: c.customer_id ? emailById.get(c.customer_id) ?? null : null,
      affiliate_code: aff?.code ?? null,
    } as AffiliateCommission;
  });

  return NextResponse.json({ commissions: enriched });
}

export async function POST(request: NextRequest) {
  const admin = await getAdmin();
  if (!admin || !can(admin, "affiliate.manage")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const adminUserId = admin.user_id;

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { action, ...payload } = body;

    // Update an affiliate's status; 404 if the id matched no row (no silent ok).
    const setAffiliateStatus = async (
      affiliateId: string,
      patch: Record<string, unknown>,
    ) => {
      const { data, error } = await supabase
        .from("affiliates")
        .update(patch)
        .eq("id", affiliateId)
        .select("id");
      if (error) return NextResponse.json({ error: "Update failed" }, { status: 500 });
      if (!data || data.length === 0) {
        return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true });
    };

    switch (action) {
      case "approve_affiliate":
      case "activate_affiliate": {
        const { affiliateId } = payload as { affiliateId: string };
        return setAffiliateStatus(affiliateId, { status: "active", approved_at: new Date().toISOString() });
      }

      case "reject_affiliate": {
        const { affiliateId } = payload as { affiliateId: string };
        return setAffiliateStatus(affiliateId, { status: "rejected" });
      }

      case "suspend_affiliate": {
        const { affiliateId } = payload as { affiliateId: string };
        return setAffiliateStatus(affiliateId, { status: "suspended" });
      }

      case "delete_affiliate": {
        // Removes the affiliate; commissions / payouts / referrals cascade.
        const { affiliateId } = payload as { affiliateId: string };
        const { error } = await supabase.from("affiliates").delete().eq("id", affiliateId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
      }

      case "mark_paid": {
        const { commissionIds } = payload as { commissionIds: string[] };
        if (!Array.isArray(commissionIds) || commissionIds.length === 0) {
          return NextResponse.json({ error: "No commissions" }, { status: 400 });
        }
        const now = new Date().toISOString();
        // Only settle commissions still PENDING (skip already-paid ones so
        // paid_out is never double-counted). Returns the rows actually flipped.
        const { data: flipped, error: flipErr } = await supabase
          .from("affiliate_commissions")
          .update({ status: "paid", paid_at: now })
          .in("id", commissionIds)
          .eq("status", "pending")
          .select("affiliate_id, amount");
        if (flipErr) return NextResponse.json({ error: "Update failed" }, { status: 500 });

        // Bump each affiliate's paid_out by the sum actually settled.
        const byAffiliate = new Map<string, number>();
        for (const c of flipped ?? []) {
          byAffiliate.set(c.affiliate_id, (byAffiliate.get(c.affiliate_id) ?? 0) + Number(c.amount));
        }
        for (const [affId, sum] of byAffiliate) {
          const { data: aff } = await supabase
            .from("affiliates").select("paid_out").eq("id", affId).single();
          await supabase
            .from("affiliates")
            .update({ paid_out: Math.round(((aff?.paid_out ?? 0) + sum) * 100) / 100 })
            .eq("id", affId);
        }
        return NextResponse.json({ success: true, settled: flipped?.length ?? 0 });
      }

      case "pay_payout": {
        const { payoutId } = payload as { payoutId: string };
        const ok = await settlePayoutAsPaid(payoutId, adminUserId);
        if (!ok) return NextResponse.json({ error: "Payout not found or already processed" }, { status: 404 });
        return NextResponse.json({ success: true });
      }

      case "reject_payout": {
        const { payoutId, note } = payload as { payoutId: string; note?: string };
        const { data, error } = await supabase
          .from("affiliate_payouts")
          .update({
            status: "rejected",
            note: note ?? null,
            processed_at: new Date().toISOString(),
            processed_by: adminUserId,
          })
          .eq("id", payoutId)
          .in("status", ["requested", "approved"])
          .select("id");
        if (error) return NextResponse.json({ error: "Update failed" }, { status: 500 });
        if (!data || data.length === 0) {
          return NextResponse.json({ error: "Payout not found or already processed" }, { status: 404 });
        }
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("[Admin Payout]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
