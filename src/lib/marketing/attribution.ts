import { getSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * Server-side access to the marketing_attribution table. Writes happen through
 * the service-role client (bypasses RLS); reads at conversion time pull the row
 * to populate the platform conversion APIs.
 */

const ATTR_COLUMNS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid",
  "ttclid",
  "fbp",
  "fbc",
  "landing_url",
  "referrer",
] as const;

export type MarketingAttributionRow = {
  user_id: string;
} & Partial<Record<(typeof ATTR_COLUMNS)[number], string | null>>;

/**
 * Last-touch merge: only the fields present in `touch` are written, so a later
 * organic-ish visit can refresh click-ids without wiping earlier UTM values.
 * first_seen_at is set once (on insert) and never overwritten.
 */
export async function upsertMarketingAttribution(
  userId: string,
  touch: Record<string, unknown>,
) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return false;

  const payload: Record<string, string> = {};
  for (const key of ATTR_COLUMNS) {
    const value = touch[key];
    if (typeof value === "string" && value.length > 0) {
      payload[key] = value.slice(0, 512);
    }
  }

  if (Object.keys(payload).length === 0) return false;

  const { error } = await supabase.from("marketing_attribution").upsert(
    {
      user_id: userId,
      ...payload,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    console.error("[Marketing Attribution] upsert failed:", error.message);
    return false;
  }
  return true;
}

export async function getMarketingAttribution(
  userId: string,
): Promise<MarketingAttributionRow | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("marketing_attribution")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[Marketing Attribution] read failed:", error.message);
    return null;
  }
  return data as MarketingAttributionRow | null;
}
