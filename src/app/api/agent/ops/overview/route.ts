/**
 * GET /api/agent/ops/overview — compact ops KPIs for agents.
 * Auth: agent key with scope `ops:overview` (Bearer / x-api-key).
 * Query: ?from=YYYY-MM-DD&to=YYYY-MM-DD (default: last 30 days).
 */
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { verifyAgentKey } from "@/lib/agent/keys";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseDate(raw: string | null): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export async function GET(request: NextRequest) {
  if (!(await verifyAgentKey(request, "ops:overview")))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = getSupabaseAdminClient();
  if (!client) return NextResponse.json({ error: "server_config" }, { status: 500 });

  const url = new URL(request.url);
  const now = new Date();
  const fromISO = parseDate(url.searchParams.get("from")) ?? new Date(now.getTime() - 30 * 86400000).toISOString();
  const toISO = parseDate(url.searchParams.get("to")) ?? now.toISOString();
  const nowISO = now.toISOString();

  try {
    const [
      { count: totalUsers },
      { count: vipUsers },
      { count: tigoldUsers },
      { count: gmActive },
      { count: gsActive },
      { count: tgActive },
      { count: newUsersInRange },
      { count: activeSubs },
      { data: rangeAmts },
    ] = await Promise.all([
      client.from("profiles").select("*", { count: "exact", head: true }),
      client.from("license_keys").select("*", { count: "exact", head: true }).eq("plan", "unlimited").eq("product", "goldmaster"),
      client.from("license_keys").select("*", { count: "exact", head: true }).eq("plan", "tigold").eq("product", "tigold"),
      client.from("license_keys").select("*", { count: "exact", head: true }).eq("product", "goldmaster").or(`is_lifetime.eq.true,expires_at.gte.${nowISO}`),
      client.from("license_keys").select("*", { count: "exact", head: true }).eq("product", "goldscalp").or(`is_lifetime.eq.true,expires_at.gte.${nowISO}`),
      client.from("license_keys").select("*", { count: "exact", head: true }).eq("product", "tigold").or(`is_lifetime.eq.true,expires_at.gte.${nowISO}`),
      client.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", fromISO).lte("created_at", toISO),
      client.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
      client.from("subscriptions").select("amount_usd").eq("status", "active").gte("created_at", fromISO).lte("created_at", toISO),
    ]);

    const total = totalUsers ?? 0;
    const vip = vipUsers ?? 0;
    const tigold = tigoldUsers ?? 0;
    const revenueInRange =
      Math.round((rangeAmts ?? []).reduce((s, r) => s + (Number((r as { amount_usd: number | null }).amount_usd) || 0), 0) * 100) / 100;

    return NextResponse.json({
      ok: true,
      range: { from: fromISO, to: toISO },
      users: { total, vip, tigold, free: Math.max(total - vip - tigold, 0), newInRange: newUsersInRange ?? 0 },
      activeByEa: { goldmaster: gmActive ?? 0, goldscalp: gsActive ?? 0, tigold: tgActive ?? 0 },
      subscriptions: { active: activeSubs ?? 0, revenueInRangeUSD: revenueInRange },
      generatedAt: nowISO,
    });
  } catch (e) {
    console.error("[agent/ops/overview]", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
