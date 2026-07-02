/**
 * GET /api/agent/ops/marketing — paid-ads funnel (leads/conversions/CVR/revenue)
 * by channel and campaign. Reuses the same aggregation as the admin marketing
 * page so numbers match. Auth: agent key with scope `ops:marketing`.
 * Query: ?from=YYYY-MM-DD&to=YYYY-MM-DD (leads scoped by first_seen_at, def 30d).
 */
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { verifyAgentKey } from "@/lib/agent/keys";
import { aggregateFunnel, ATTR_SELECT, type AttrRow } from "@/lib/marketing/funnel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROW_CAP = 5000;

function parseDate(raw: string | null): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export async function GET(request: NextRequest) {
  if (!(await verifyAgentKey(request, "ops:marketing")))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = getSupabaseAdminClient();
  if (!client) return NextResponse.json({ error: "server_config" }, { status: 500 });

  const url = new URL(request.url);
  const now = new Date();
  const fromISO = parseDate(url.searchParams.get("from")) ?? new Date(now.getTime() - 30 * 86400000).toISOString();
  const toISO = parseDate(url.searchParams.get("to")) ?? now.toISOString();

  try {
    const [{ data: attrRows }, { data: activeSubs }] = await Promise.all([
      client
        .from("marketing_attribution")
        .select(ATTR_SELECT)
        .gte("first_seen_at", fromISO)
        .lte("first_seen_at", toISO)
        .limit(ROW_CAP),
      client.from("subscriptions").select("user_id").eq("status", "active"),
    ]);

    const convertedUsers = new Set((activeSubs ?? []).map((s) => (s as { user_id: string }).user_id));
    const funnel = aggregateFunnel((attrRows ?? []) as AttrRow[], convertedUsers);

    return NextResponse.json({
      ok: true,
      range: { from: fromISO, to: toISO },
      ...funnel,
      generatedAt: now.toISOString(),
    });
  } catch (e) {
    console.error("[agent/ops/marketing]", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
