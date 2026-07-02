/**
 * GET /api/admin/revenue-events
 * Super-admin only. Returns the most recent "money in" events so the backoffice
 * can chime when a new payment lands. Sources:
 *   - Stripe: active rows in `subscriptions` (created_at = first paid).
 *   - VietQR/SePay: confirmed rows in `vietqr_payment_requests` (if the table
 *     exists — guarded, ignored otherwise).
 * Detection of "new" is done client-side (it remembers which event ids it has
 * already seen), so this endpoint just returns a recent window.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getAdmin, batchGetEmails } from "@/lib/admin/auth";

interface RevenueEvent {
  id: string;
  at: string;          // ISO timestamp of the payment
  source: "Stripe" | "VietQR";
  amount: number;
  currency: "USD" | "VND";
  email: string | null;
}

export async function GET(_request: NextRequest) {
  const admin = await getAdmin();
  if (!admin || admin.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const client = getSupabaseAdminClient();
  if (!client) return NextResponse.json({ error: "Server config" }, { status: 500 });

  try {
    // Stripe subs + VietQR requests run in parallel (independent queries).
    const [subsRes, vqRes] = await Promise.all([
      client
        .from("subscriptions")
        .select("id, user_id, created_at")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(15),
      // VietQR / SePay — table may not exist on every deploy; swallow if so.
      client
        .from("vietqr_payment_requests")
        .select("id, user_id, amount_vnd, confirmed_at")
        .eq("status", "confirmed")
        .order("confirmed_at", { ascending: false })
        .limit(15),
    ]);
    const subs = subsRes.data;
    let vq: { id: string; user_id: string; amount_vnd: number; confirmed_at: string | null }[] = [];
    if (!vqRes.error && vqRes.data) vq = vqRes.data as typeof vq;

    const userIds = [
      ...(subs ?? []).map((s) => s.user_id as string),
      ...vq.map((v) => v.user_id),
    ].filter(Boolean);
    const emails = await batchGetEmails(client, userIds);

    const events: RevenueEvent[] = [
      ...(subs ?? []).map((s) => ({
        id: `sub_${s.id}`,
        at: s.created_at as string,
        source: "Stripe" as const,
        amount: 59,
        currency: "USD" as const,
        email: emails.get(s.user_id as string) ?? null,
      })),
      ...vq.map((v) => ({
        id: `vq_${v.id}`,
        at: (v.confirmed_at ?? new Date(0).toISOString()),
        source: "VietQR" as const,
        amount: v.amount_vnd,
        currency: "VND" as const,
        email: emails.get(v.user_id) ?? null,
      })),
    ]
      .filter((e) => e.at)
      .sort((a, b) => (a.at < b.at ? 1 : -1))
      .slice(0, 20);

    return NextResponse.json({ events });
  } catch (e) {
    console.error("[Admin Revenue Events]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
