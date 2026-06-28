/**
 * Server-side affiliate settings — reads from DB, falls back to defaults.
 * Settings are configurable via admin panel (POST /api/admin/affiliate/settings).
 */
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { AffiliateSettings } from "./types";

const DEFAULTS: AffiliateSettings = {
  commission_rate: 0.30,
  cookie_days: 30,
  min_payout: 50,
  program_active: true,
};

let cachedSettings: AffiliateSettings | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 60_000; // 1 minute

export async function getAffiliateSettings(): Promise<AffiliateSettings> {
  const now = Date.now();
  if (cachedSettings && now - cacheTime < CACHE_TTL_MS) {
    return cachedSettings;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) return DEFAULTS;

  const { data } = await supabase
    .from("affiliate_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (!data) {
    cachedSettings = DEFAULTS;
    cacheTime = now;
    return DEFAULTS;
  }

  cachedSettings = {
    commission_rate: data.commission_rate ?? DEFAULTS.commission_rate,
    cookie_days: data.cookie_days ?? DEFAULTS.cookie_days,
    min_payout: data.min_payout ?? DEFAULTS.min_payout,
    program_active: data.program_active ?? DEFAULTS.program_active,
  };
  cacheTime = now;
  return cachedSettings;
}

/** Invalidate cache (call after admin updates settings) */
export function invalidateAffiliateSettingsCache(): void {
  cachedSettings = null;
  cacheTime = 0;
}
