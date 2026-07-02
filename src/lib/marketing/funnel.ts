/**
 * Shared paid-ads funnel aggregation, used by both the admin marketing API and
 * the per-partner marketing API so the two always compute leads/conversions/
 * CVR/revenue the same way.
 */

export const SUB_PRICE = 59; // flat per-active-sub revenue proxy (matches overview)

export type AttrRow = {
  user_id: string;
  utm_source: string | null;
  utm_campaign: string | null;
  gclid: string | null;
  fbclid: string | null;
  ttclid: string | null;
  first_seen_at: string;
};

export type FunnelBucket = {
  key: string;
  leads: number;
  conversions: number;
  revenue: number;
  cvr: number;
};

/** Channel label: explicit utm_source, else inferred from the click-id, else direct. */
export function channelOf(row: AttrRow): string {
  if (row.utm_source) return row.utm_source.toLowerCase();
  if (row.gclid) return "google";
  if (row.fbclid) return "facebook";
  if (row.ttclid) return "tiktok";
  return "(direct/unknown)";
}

function withCvr(b: Omit<FunnelBucket, "cvr">): FunnelBucket {
  return { ...b, cvr: b.leads > 0 ? Math.round((b.conversions / b.leads) * 1000) / 10 : 0 };
}

/**
 * Aggregate attribution rows into totals + by-channel + by-campaign buckets.
 * `convertedUsers` is the set of user_ids with an active subscription.
 */
export function aggregateFunnel(rows: AttrRow[], convertedUsers: Set<string>) {
  const byChannel = new Map<string, Omit<FunnelBucket, "cvr">>();
  const byCampaign = new Map<string, Omit<FunnelBucket, "cvr">>();
  let leads = 0;
  let conversions = 0;

  const bump = (m: Map<string, Omit<FunnelBucket, "cvr">>, key: string, converted: boolean) => {
    const b = m.get(key) ?? { key, leads: 0, conversions: 0, revenue: 0 };
    b.leads += 1;
    if (converted) {
      b.conversions += 1;
      b.revenue += SUB_PRICE;
    }
    m.set(key, b);
  };

  for (const row of rows) {
    const converted = convertedUsers.has(row.user_id);
    leads += 1;
    if (converted) conversions += 1;
    bump(byChannel, channelOf(row), converted);
    bump(byCampaign, row.utm_campaign || "(none)", converted);
  }

  const sortBuckets = (m: Map<string, Omit<FunnelBucket, "cvr">>) =>
    [...m.values()].map(withCvr).sort((a, b) => b.leads - a.leads);

  return {
    totals: {
      leads,
      conversions,
      cvr: leads > 0 ? Math.round((conversions / leads) * 1000) / 10 : 0,
      revenue: conversions * SUB_PRICE,
    },
    byChannel: sortBuckets(byChannel),
    byCampaign: sortBuckets(byCampaign),
  };
}

export const ATTR_SELECT = "user_id, utm_source, utm_campaign, gclid, fbclid, ttclid, first_seen_at";
