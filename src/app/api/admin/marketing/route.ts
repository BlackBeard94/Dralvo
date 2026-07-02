/**
 * GET /api/admin/marketing
 * Platform-wide paid-ads funnel: leads / conversions / CVR / attributed revenue
 * by channel, by campaign and BY PARTNER, plus a recent-conversions list.
 *
 * Query params:
 *   ?from=YYYY-MM-DD&to=YYYY-MM-DD  scope leads by first_seen_at (default 30d)
 *   ?partnerId=<uuid>              restrict to one partner's customers
 *
 * Gated by finance.view (revenue is sensitive). "Converted" = the attributed
 * user has an active subscription; revenue uses the flat $59/sub proxy.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getAdmin, batchGetEmails } from "@/lib/admin/auth";
import {
  aggregateFunnel,
  channelOf,
  ATTR_SELECT,
  SUB_PRICE,
  type AttrRow,
} from "@/lib/marketing/funnel";

const ROW_CAP = 5000;

function parseDate(raw: string | null): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export async function GET(request: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "super_admin" && !admin.permissions.marketing?.view) {
    return NextResponse.json({ error: "Bạn không có quyền xem mục này." }, { status: 403 });
  }

  const client = getSupabaseAdminClient();
  if (!client) return NextResponse.json({ error: "Server config" }, { status: 500 });

  try {
    const url = new URL(request.url);
    const now = new Date();
    const fromISO =
      parseDate(url.searchParams.get("from")) ??
      new Date(now.getTime() - 30 * 86400000).toISOString();
    const toISO = parseDate(url.searchParams.get("to")) ?? now.toISOString();
    const partnerFilter = url.searchParams.get("partnerId");

    // Partner directory + the user→partner map (for the by-partner breakdown).
    const [{ data: partnersData }, { data: referredProfiles }] = await Promise.all([
      client.from("partners").select("id, code, name"),
      client.from("profiles").select("id, referrer_id").eq("referrer_type", "partner"),
    ]);
    const partnerMeta = new Map<string, { code: string; name: string | null }>(
      (partnersData ?? []).map((p) => [p.id as string, { code: p.code as string, name: (p.name as string) ?? null }]),
    );
    const userPartner = new Map<string, string>(
      (referredProfiles ?? []).map((p) => [p.id as string, p.referrer_id as string]),
    );

    // When filtering to one partner, restrict attribution rows to its customers.
    let attrQuery = client
      .from("marketing_attribution")
      .select(ATTR_SELECT)
      .gte("first_seen_at", fromISO)
      .lte("first_seen_at", toISO)
      .order("first_seen_at", { ascending: false })
      .limit(ROW_CAP);
    if (partnerFilter) {
      const ids = [...userPartner.entries()].filter(([, pid]) => pid === partnerFilter).map(([uid]) => uid);
      if (ids.length === 0) {
        return NextResponse.json({
          role: admin.role,
          range: { from: fromISO, to: toISO },
          capped: false,
          totals: { leads: 0, conversions: 0, cvr: 0, revenue: 0 },
          byChannel: [],
          byCampaign: [],
          byPartner: [],
          channels: [],
          campaigns: [],
          partners: [...partnerMeta.entries()].map(([id, m]) => ({ id, ...m })),
          recentConversions: [],
        });
      }
      attrQuery = attrQuery.in("user_id", ids);
    }

    const [{ data: attrData, error: attrErr }, { data: subData, error: subErr }] = await Promise.all([
      attrQuery,
      client.from("subscriptions").select("user_id").eq("status", "active"),
    ]);

    if (attrErr || subErr) {
      console.error("[Admin Marketing] query", attrErr ?? subErr);
      return NextResponse.json({ error: "Không tải được dữ liệu marketing." }, { status: 500 });
    }

    const allRows = (attrData ?? []) as AttrRow[];
    const convertedUsers = new Set((subData ?? []).map((s) => s.user_id as string));
    // Distinct traffic sources + campaigns (for the filter dropdowns) — from the unfiltered set.
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
    // Share of total traffic (tỉ lệ) per source.
    const byChannel = funnel.byChannel.map((b) => ({
      ...b,
      share: funnel.totals.leads ? Math.round((b.leads / funnel.totals.leads) * 1000) / 10 : 0,
    }));

    // By-partner breakdown (skipped when already filtered to one partner).
    const byPartnerMap = new Map<string, { leads: number; conversions: number; revenue: number }>();
    for (const row of rows) {
      const pid = userPartner.get(row.user_id) ?? "__direct__";
      const b = byPartnerMap.get(pid) ?? { leads: 0, conversions: 0, revenue: 0 };
      b.leads += 1;
      if (convertedUsers.has(row.user_id)) {
        b.conversions += 1;
        b.revenue += SUB_PRICE;
      }
      byPartnerMap.set(pid, b);
    }
    const byPartner = [...byPartnerMap.entries()]
      .map(([pid, b]) => ({
        partnerId: pid === "__direct__" ? null : pid,
        label: pid === "__direct__" ? "Dralvo trực tiếp" : partnerMeta.get(pid)?.name || partnerMeta.get(pid)?.code || pid.slice(0, 8),
        ...b,
        cvr: b.leads > 0 ? Math.round((b.conversions / b.leads) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.leads - a.leads);

    // Recent converted leads for the activity list.
    const recentConverted = rows.filter((r) => convertedUsers.has(r.user_id)).slice(0, 12);
    const emails = await batchGetEmails(client, recentConverted.map((r) => r.user_id));

    return NextResponse.json({
      role: admin.role,
      range: { from: fromISO, to: toISO },
      capped: rows.length >= ROW_CAP,
      totals: funnel.totals,
      byChannel,
      byCampaign: funnel.byCampaign,
      byPartner,
      channels,
      campaigns,
      partners: [...partnerMeta.entries()].map(([id, m]) => ({ id, ...m })),
      recentConversions: recentConverted.map((r) => {
        const pid = userPartner.get(r.user_id);
        return {
          user_id: r.user_id,
          email: emails.get(r.user_id) ?? null,
          channel: channelOf(r),
          campaign: r.utm_campaign || "(none)",
          partner: pid ? partnerMeta.get(pid)?.name || partnerMeta.get(pid)?.code || null : null,
          first_seen_at: r.first_seen_at,
        };
      }),
    });
  } catch (e) {
    console.error("[Admin Marketing]", e);
    return NextResponse.json({ error: "Lỗi hệ thống." }, { status: 500 });
  }
}
