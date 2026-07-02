/**
 * Marketing / ad-tracking configuration. Every id is read from the environment
 * so the whole tracking stack is a NO-OP until the corresponding id is set —
 * safe to ship before the ad accounts exist.
 *
 * Public (NEXT_PUBLIC_*) ids are exposed to the browser pixels. Server secrets
 * (access tokens / api secrets) live in marketing/conversions.ts and are never
 * referenced from client code.
 */

export const marketingPublicConfig = {
  // Google Analytics 4 — "G-XXXXXXXXXX"
  ga4Id: process.env.NEXT_PUBLIC_GA4_ID ?? "",
  // Google Ads — "AW-XXXXXXXXX"
  googleAdsId: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? "",
  // Google Ads purchase conversion label — "AW-XXXXXXXXX/abcDEFghIJklMN"
  googleAdsPurchaseLabel: process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL ?? "",
  // Meta (Facebook) Pixel id
  metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "",
  // TikTok Pixel id
  tiktokPixelId: process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID ?? "",
} as const;

/** True when GA4 or Google Ads is configured (both ride the same gtag.js). */
export const hasGtag = Boolean(
  marketingPublicConfig.ga4Id || marketingPublicConfig.googleAdsId,
);
