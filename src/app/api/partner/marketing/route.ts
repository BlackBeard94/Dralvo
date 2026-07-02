/**
 * GET /api/partner/marketing — a partner's OWN paid-ads funnel, scoped to the
 * customers attributed to them (profiles.referrer_type='partner'). Leads /
 * conversions / CVR / revenue by channel + campaign. Range via ?from&?to.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getPartner } from "@/lib/partners/auth";
import { aggregateFunnel, channelOf, ATTR_SELECT, type AttrRow } from "@/lib/marketing/funnel";

const CUSTOMER_CAP = 5000;

function parseDate(raw: string | null): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export async function GET(request: NextRequest) {
  const partner = await getPartner();
  if (!partner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = getSupabaseAdminClient();
  if (!client) return NextResponse.json({ error: "Server config" }, { status: 500 });

  try {
    const url = new URL(request.url);
    const now = new Date();
    const fromISO =
      parseDate(url.searchParams.get("from")) ??
      new Date(now.getTime() - 30 * 86400000).toISOString();
    const toISO = parseDate(url.searchParams.get("to")) ?? now.toISOString();

    // This partner's customers.
    const { data: customers } = await client
      .from("profiles")
      .select("id")
      .eq("referrer_type", "partner")
      .eq("referrer_id", partner.id)
      .limit(CUSTOMER_CAP);
    const customerIds = (customers ?? []).map((c) => c.id as string);

    if (customerIds.length === 0) {
      return NextResponse.json({
        range: { from: fromISO, to: toISO },
        totals: { leads: 0, conversions: 0, cvr: 0, revenue: 0 },
        byChannel: [],
        byCampaign: [],
        channels: [],
        campaigns: [],
      });
    }

    // Attribution rows for those customers within range + their active subs.
    const [{ data: attrData }, { data: subData }] = await Promise.all([
      client
        .from("marketing_attribution")
        .select(ATTR_SELECT)
        .in("user_id", customerIds)
        .gte("first_seen_at", fromISO)
        .lte("first_seen_at", toISO),
      client
        .from("subscriptions")
        .select("user_id")
        .eq("status", "active")
        .in("user_id", customerIds),
    ]);

    const allRows = (attrData ?? []) as AttrRow[];
    const convertedUsers = new Set((subData ?? []).map((s) => s.user_id as string));
    const channels = [...new Set(allRows.map(channelOf))].sort();
    const campaigns = [...new Set(allRows.map((r) => r.utm_campaign || "(none)"))].sort();
    const channelFilter = url.searchParams.get("channel");
    const campaignFilter = url.searchParams.get("campaign");
    const rows = allRows.filter(
      (r) =>
        (!channelFilter || channelOf(r) === channelFilter) &&
        (!campaignFilter || (r.utm_campaign || "(none)") === campaignFilter),
    );
    const funnel = aggregateFunnel(rows, convertedUsers);
    const byChannel = funnel.byChannel.map((b) => ({
      ...b,
      share: funnel.totals.leads ? Math.round((b.leads / funnel.totals.leads) * 1000) / 10 : 0,
    }));

    return NextResponse.json({ range: { from: fromISO, to: toISO }, ...funnel, byChannel, channels, campaigns });
  } catch (e) {
    console.error("[Partner Marketing]", e);
    return NextResponse.json({ error: "Lỗi hệ thống." }, { status: 500 });
  }
}
