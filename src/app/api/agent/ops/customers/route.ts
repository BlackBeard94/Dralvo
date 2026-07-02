/**
 * GET /api/agent/ops/customers — feed of recent signups + recent paid subs.
 * Auth: agent key with scope `ops:customers` (Bearer / x-api-key).
 * Query: ?since=ISO (filter by created_at), ?limit=1..100 (default 20).
 * Returns minimal PII: email + plan/product + timestamp only.
 */
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { batchGetEmails } from "@/lib/admin/auth";
import { verifyAgentKey } from "@/lib/agent/keys";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await verifyAgentKey(request, "ops:customers")))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = getSupabaseAdminClient();
  if (!client) return NextResponse.json({ error: "server_config" }, { status: 500 });

  const url = new URL(request.url);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") ?? "20", 10) || 20, 1), 100);
  const sinceRaw = url.searchParams.get("since");
  const since = sinceRaw && !Number.isNaN(new Date(sinceRaw).getTime()) ? new Date(sinceRaw).toISOString() : null;

  try {
    let signupQ = client.from("profiles").select("id, created_at").order("created_at", { ascending: false }).limit(limit);
    let payQ = client.from("subscriptions").select("user_id, plan, amount_usd, status, created_at").eq("status", "active").order("created_at", { ascending: false }).limit(limit);
    if (since) {
      signupQ = signupQ.gte("created_at", since);
      payQ = payQ.gte("created_at", since);
    }
    const [{ data: signups }, { data: payments }] = await Promise.all([signupQ, payQ]);

    const rows = signups ?? [];
    const pays = payments ?? [];
    const emails = await batchGetEmails(client, [
      ...rows.map((r) => r.id as string),
      ...pays.map((p) => p.user_id as string),
    ]);

    return NextResponse.json({
      ok: true,
      since,
      newCustomers: rows.map((r) => ({
        email: emails.get(r.id as string) ?? null,
        signedUpAt: r.created_at as string,
      })),
      newPayments: pays.map((p) => ({
        email: emails.get(p.user_id as string) ?? null,
        plan: p.plan as string,
        amountUSD: Number(p.amount_usd) || 0,
        paidAt: p.created_at as string,
      })),
      generatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[agent/ops/customers]", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
