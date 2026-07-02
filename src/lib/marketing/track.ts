"use client";

/**
 * Browser-side ad event helpers. Each call is a no-op when the matching pixel
 * isn't loaded, so callers can fire them unconditionally. Purchase events pass
 * the Stripe session id as the event id so the server-side conversions
 * (lib/marketing/conversions.ts) de-duplicate against them.
 */

import { marketingPublicConfig } from "@/lib/marketing/config";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    ttq?: { track: (event: string, params?: unknown, opts?: unknown) => void };
  }
}

/** Top-of-funnel lead: signup completed or Telegram CTA clicked. */
export function trackLead(label?: string) {
  if (typeof window === "undefined") return;
  window.gtag?.("event", "generate_lead", label ? { lead_source: label } : {});
  window.fbq?.("track", "Lead", label ? { content_name: label } : {});
  window.ttq?.track("SubmitForm", label ? { content_name: label } : {});
}

/** User started Stripe checkout. */
export function trackInitiateCheckout(value?: number, currency = "USD") {
  if (typeof window === "undefined") return;
  const params = value ? { value, currency } : {};
  window.gtag?.("event", "begin_checkout", params);
  window.fbq?.("track", "InitiateCheckout", params);
  window.ttq?.track("InitiateCheckout", params);
}

/**
 * Purchase completed. Fired browser-side on the post-checkout success page —
 * mainly to drive the Google Ads conversion (hard to do server-side), while
 * Meta/GA4/TikTok also get a deduped copy via `eventID`/`event_id`.
 */
export function trackPurchase(params: {
  value: number;
  currency: string;
  orderId: string;
}) {
  if (typeof window === "undefined") return;
  const { value, currency, orderId } = params;

  // GA4 purchase
  window.gtag?.("event", "purchase", {
    transaction_id: orderId,
    value,
    currency,
  });

  // Google Ads conversion (needs the full "AW-XXXX/label" send_to)
  if (marketingPublicConfig.googleAdsPurchaseLabel) {
    window.gtag?.("event", "conversion", {
      send_to: marketingPublicConfig.googleAdsPurchaseLabel,
      value,
      currency,
      transaction_id: orderId,
    });
  }

  // Meta — eventID matches the server CAPI event_id (Stripe session id)
  window.fbq?.("track", "Purchase", { value, currency }, { eventID: orderId });

  // TikTok — event_id matches the server Events API event_id
  window.ttq?.track(
    "CompletePayment",
    { value, currency, content_type: "product" },
    { event_id: orderId },
  );
}
