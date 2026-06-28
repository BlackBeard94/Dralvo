/**
 * GET/POST /api/admin/affiliate/payout
 * Admin: list pending commissions, mark as paid, manage affiliates.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { AffiliateWithUser, AffiliateCommission } from "@/lib/affiliate/types";

const ADMIN_IDS = (process.env.AFFILIATE_ADMIN_IDS ?? "").split(",").filter(Boolean);

async function ensureAdmin(request: NextRequest): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); }, setAll() { } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    if (ADMIN_IDS.length > 0) return ADMIN_IDS.includes(user.id);
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  if (!(await ensureAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const url = new URL(request.url);
  const action = url.searchParams.get("action") ?? "commissions";

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

  // Default: list pending commissions
  const { data: commissions } = await supabase
    .from("affiliate_commissions")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(100);

  return NextResponse.json({ commissions: (commissions ?? []) as AffiliateCommission[] });
}

export async function POST(request: NextRequest) {
  if (!(await ensureAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { action, ...payload } = body;

    switch (action) {
      case "approve_affiliate": {
        const { affiliateId } = payload as { affiliateId: string };
        await supabase
          .from("affiliates")
          .update({ status: "active", approved_at: new Date().toISOString() })
          .eq("id", affiliateId);
        return NextResponse.json({ success: true });
      }

      case "reject_affiliate": {
        const { affiliateId } = payload as { affiliateId: string };
        await supabase
          .from("affiliates")
          .update({ status: "rejected" })
          .eq("id", affiliateId);
        return NextResponse.json({ success: true });
      }

      case "suspend_affiliate": {
        const { affiliateId } = payload as { affiliateId: string };
        await supabase
          .from("affiliates")
          .update({ status: "suspended" })
          .eq("id", affiliateId);
        return NextResponse.json({ success: true });
      }

      case "mark_paid": {
        const { commissionIds } = payload as { commissionIds: string[] };
        const now = new Date().toISOString();
        await supabase
          .from("affiliate_commissions")
          .update({ status: "paid", paid_at: now })
          .in("id", commissionIds);

        // Update affiliate paid_out
        for (const cid of commissionIds) {
          const { data: comm } = await supabase
            .from("affiliate_commissions")
            .select("affiliate_id, amount")
            .eq("id", cid)
            .single();
          if (comm) {
            const { data: aff } = await supabase
              .from("affiliates")
              .select("paid_out")
              .eq("id", comm.affiliate_id)
              .single();
            const newPaid = (aff?.paid_out ?? 0) + comm.amount;
            await supabase
              .from("affiliates")
              .update({ paid_out: newPaid })
              .eq("id", comm.affiliate_id);
          }
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
