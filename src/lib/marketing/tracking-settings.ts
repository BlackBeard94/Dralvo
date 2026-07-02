import { cookies } from "next/headers";

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { marketingPublicConfig } from "@/lib/marketing/config";

/**
 * Pixel/tracking settings: read + validate. Settings live in the
 * `tracking_settings` table (scope 'dralvo' | 'partner') and are editable from
 * the admin/partner UIs. Dralvo's own ids fall back to the NEXT_PUBLIC_* env
 * when no DB row overrides them.
 */

export type PixelIds = {
  ga4Id: string;
  googleAdsId: string;
  googleAdsPurchaseLabel: string;
  metaPixelId: string;
  tiktokPixelId: string;
};

export type TrackingSettings = PixelIds & {
  customHead: string;
  customBody: string;
};

/**
 * Strict allowlist validators. A value is only ever inlined into a pixel
 * <script> after passing one of these, so it cannot contain quotes / angle
 * brackets / backslashes and cannot break out of the JS string literal.
 * Returns the normalized value, or "" if invalid (treated as "not set").
 */
const VALIDATORS: Record<keyof PixelIds, (raw: string) => string> = {
  ga4Id: (v) => (/^G-[A-Z0-9]{4,20}$/.test(v.toUpperCase()) ? v.toUpperCase() : ""),
  googleAdsId: (v) => (/^AW-\d{6,15}$/.test(v.toUpperCase()) ? v.toUpperCase() : ""),
  googleAdsPurchaseLabel: (v) =>
    /^AW-\d{6,15}\/[A-Za-z0-9_-]{6,40}$/.test(v) ? v : "",
  metaPixelId: (v) => (/^\d{6,20}$/.test(v) ? v : ""),
  tiktokPixelId: (v) => (/^[A-Z0-9]{8,32}$/.test(v.toUpperCase()) ? v.toUpperCase() : ""),
};

export const PIXEL_KEYS = Object.keys(VALIDATORS) as (keyof PixelIds)[];

/** Validate a single pixel id. Empty input stays empty (clears the field). */
export function validatePixelId(key: keyof PixelIds, raw: unknown): string {
  if (typeof raw !== "string" || raw.trim() === "") return "";
  return VALIDATORS[key](raw.trim());
}

/** Validate a whole pixel-id payload, dropping anything that fails. */
export function sanitizePixelIds(input: Record<string, unknown>): PixelIds {
  return {
    ga4Id: validatePixelId("ga4Id", input.ga4Id ?? input.ga4_id),
    googleAdsId: validatePixelId("googleAdsId", input.googleAdsId ?? input.google_ads_id),
    googleAdsPurchaseLabel: validatePixelId(
      "googleAdsPurchaseLabel",
      input.googleAdsPurchaseLabel ?? input.google_ads_purchase_label,
    ),
    metaPixelId: validatePixelId("metaPixelId", input.metaPixelId ?? input.meta_pixel_id),
    tiktokPixelId: validatePixelId("tiktokPixelId", input.tiktokPixelId ?? input.tiktok_pixel_id),
  };
}

type SettingsRow = {
  ga4_id: string | null;
  google_ads_id: string | null;
  google_ads_purchase_label: string | null;
  meta_pixel_id: string | null;
  tiktok_pixel_id: string | null;
  custom_head: string | null;
  custom_body: string | null;
  enabled: boolean;
};

function rowToPixelIds(row: SettingsRow | null): PixelIds {
  return {
    ga4Id: validatePixelId("ga4Id", row?.ga4_id ?? ""),
    googleAdsId: validatePixelId("googleAdsId", row?.google_ads_id ?? ""),
    googleAdsPurchaseLabel: validatePixelId(
      "googleAdsPurchaseLabel",
      row?.google_ads_purchase_label ?? "",
    ),
    metaPixelId: validatePixelId("metaPixelId", row?.meta_pixel_id ?? ""),
    tiktokPixelId: validatePixelId("tiktokPixelId", row?.tiktok_pixel_id ?? ""),
  };
}

/** Dralvo's own settings: DB row overrides env per-field; raw snippets included. */
export async function getDralvoTrackingSettings(): Promise<TrackingSettings> {
  const env = marketingPublicConfig;
  const fallback: TrackingSettings = {
    ga4Id: env.ga4Id,
    googleAdsId: env.googleAdsId,
    googleAdsPurchaseLabel: env.googleAdsPurchaseLabel,
    metaPixelId: env.metaPixelId,
    tiktokPixelId: env.tiktokPixelId,
    customHead: "",
    customBody: "",
  };

  const supabase = getSupabaseAdminClient();
  if (!supabase) return fallback;

  const { data } = await supabase
    .from("tracking_settings")
    .select("*")
    .eq("scope", "dralvo")
    .maybeSingle();

  const row = data as SettingsRow | null;
  if (!row || row.enabled === false) return fallback;

  const ids = rowToPixelIds(row);
  // Per-field override: keep env value when the DB field is blank/invalid.
  return {
    ga4Id: ids.ga4Id || fallback.ga4Id,
    googleAdsId: ids.googleAdsId || fallback.googleAdsId,
    googleAdsPurchaseLabel: ids.googleAdsPurchaseLabel || fallback.googleAdsPurchaseLabel,
    metaPixelId: ids.metaPixelId || fallback.metaPixelId,
    tiktokPixelId: ids.tiktokPixelId || fallback.tiktokPixelId,
    customHead: (row.custom_head ?? "").slice(0, 8000),
    customBody: (row.custom_body ?? "").slice(0, 8000),
  };
}

/** A specific partner's pixel ids (ids only — partners never get raw code). */
export async function getPartnerPixelIds(partnerId: string): Promise<PixelIds> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return rowToPixelIds(null);

  const { data } = await supabase
    .from("tracking_settings")
    .select("*")
    .eq("scope", "partner")
    .eq("partner_id", partnerId)
    .maybeSingle();

  const row = data as SettingsRow | null;
  if (!row || row.enabled === false) return rowToPixelIds(null);
  return rowToPixelIds(row);
}

/**
 * Resolve the pixel ids of the partner whose referral cookie is present on the
 * current request (so their pixels fire for their referred visitor). Returns
 * null when there's no active partner cookie / no matching partner.
 */
export async function getActivePartnerPixels(): Promise<PixelIds | null> {
  const cookieStore = await cookies();
  const code = cookieStore.get("dralvo_partner")?.value;
  if (!code) return null;

  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const { data: partner } = await supabase
    .from("partners")
    .select("id")
    .eq("code", code)
    .eq("status", "active")
    .maybeSingle();

  if (!partner?.id) return null;
  return getPartnerPixelIds(partner.id as string);
}

/** True when a pixel-id set has at least one id worth rendering. */
export function hasAnyPixel(ids: PixelIds): boolean {
  return Boolean(
    ids.ga4Id || ids.googleAdsId || ids.metaPixelId || ids.tiktokPixelId,
  );
}
