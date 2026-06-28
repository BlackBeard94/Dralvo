/**
 * GET /api/admin/finance
 * Revenue dashboard: Stripe payments with date filters.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getAdmin, can, batchGetEmails } from "@/lib/admin/auth";

export async function GET(request: NextRequest) {
  const admin = await getAdmin();
  if (!admin || !can(admin, "finance.view")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = getSupabaseAdminClient();
  if (!client) return NextResponse.json({ error: "Server config" }, { status: 500 });

  try {
    const url = new URL(request.url);
    const from = url.searchParams.get("from") ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const to = url.searchParams.get("to") ?? new Date().toISOString().slice(0, 10);
    const page = parseInt(url.searchParams.get("page") ?? "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20"), 100);

    const fromISO = `${from}T00:00:00Z`;
    const toISO = `${to}T23:59:59Z`;

    interface Payment {
      id: string;
      date: string;
      user_id: string;
      email: string | null;
      amount: number;
      currency: string;
      status: string;
    }

    const { data: subs } = await client
      .from("subscriptions")
      .select("*")
      .gte("created_at", fromISO)
      .lte("created_at", toISO)
      .order("created_at", { ascending: false });

    const payments: Payment[] = [];
    if (subs) {
      // ponytail: batch emails — one listUsers call, not N getUserById
      const emails = await batchGetEmails(client, subs.map((s) => s.user_id));
      for (const s of subs) {
        payments.push({
          id: s.id,
          date: s.created_at,
          user_id: s.user_id,
          email: emails.get(s.user_id) ?? null,
          amount: 59, // ponytail: hardcode Unlimited price
          currency: "USD",
          status: s.status,
        });
      }
    }

    const total = payments.length;
    const paged = payments.slice((page - 1) * limit, page * limit);
    const stripeTotal = payments.reduce((s, p) => s + p.amount, 0);

    return NextResponse.json({
      payments: paged,
      total,
      page,
      limit,
      totals: { stripeUSD: stripeTotal },
    });
  } catch (e) {
    console.error("[Admin Finance]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
