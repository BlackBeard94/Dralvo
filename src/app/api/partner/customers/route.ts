/**
 * GET /api/partner/customers
 * The logged-in partner's own customers (profiles attributed to them).
 * Scoped strictly to the resolved partner.id — never a client-supplied id.
 */
import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getPartner } from "@/lib/partners/auth";

interface CustomerRow {
  user_id: string;
  email: string | null;
  plan: string | null;
  created_at: string;
  status?: string | null;
}

export async function GET() {
  const partner = await getPartner();
  if (!partner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const client = getSupabaseAdminClient();
  if (!client) return NextResponse.json({ error: "Server config" }, { status: 500 });

  try {
    const { data: profiles, error } = await client
      .from("profiles")
      .select("id, email, plan, created_at")
      .eq("referrer_type", "partner")
      .eq("referrer_id", partner.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const rows = profiles ?? [];
    const ids = rows.map((p) => p.id);

    // Resolve subscription status (best-effort) for these customers.
    const statusByUser = new Map<string, string>();
    if (ids.length > 0) {
      const { data: subs } = await client
        .from("subscriptions")
        .select("user_id, status")
        .in("user_id", ids);
      for (const s of subs ?? []) {
        if (s.user_id && s.status) statusByUser.set(s.user_id, s.status);
      }
    }

    const customers: CustomerRow[] = rows.map((p) => ({
      user_id: p.id,
      email: p.email ?? null,
      plan: p.plan ?? null,
      created_at: p.created_at,
      status: statusByUser.get(p.id) ?? null,
    }));

    return NextResponse.json({ customers });
  } catch (e) {
    console.error("[Partner Customers]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
