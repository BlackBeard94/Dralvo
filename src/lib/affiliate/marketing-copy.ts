import type { AffiliateSettings } from "./types";

/**
 * The marketing copy (AFFILIATE_COPY) bakes the DEFAULT numbers (30% rate,
 * 30-day cookie, $50 min payout) into sentences across all locales. This walks a
 * copy subtree and swaps those baked defaults for the live admin settings, so
 * the public /affiliate page always shows the real commission rate etc.
 *
 * Only apply this to the MARKETING sections (hero/how/commission/why/faq/cta) —
 * NOT the dashboard/admin sub-objects, which are rendered by the client dashboard
 * without settings.
 */
export function substituteAffiliateNumbers<T>(value: T, settings: AffiliateSettings): T {
  const ratePct = Math.round(settings.commission_rate * 100);
  const minPayout = settings.min_payout;
  const cookieDays = settings.cookie_days;

  const one = (str: string): string =>
    str
      // commission rate — the only "NN%" in the marketing copy
      .replace(/30%/g, () => `${ratePct}%`)
      // cookie window — "30 <day-word>" in each locale
      .replace(
        /30(\s+)(ngày|days|dias|días|hari|يوم[ًا]*)/gu,
        (_m, sp: string, unit: string) => `${cookieDays}${sp}${unit}`,
      )
      // minimum payout — "$50" / "US$ 50" / "50 USD"
      .replace(/US\$\s?50/g, () => `US$ ${minPayout}`)
      .replace(/\$50/g, () => `$${minPayout}`)
      .replace(/\b50(\s?)USD/g, (_m, sp: string) => `${minPayout}${sp}USD`);

  const walk = (v: unknown): unknown => {
    if (typeof v === "string") return one(v);
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") {
      const out: Record<string, unknown> = {};
      for (const k of Object.keys(v as Record<string, unknown>)) {
        out[k] = walk((v as Record<string, unknown>)[k]);
      }
      return out;
    }
    return v;
  };

  return walk(value) as T;
}
