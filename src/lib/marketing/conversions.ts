import { createHash } from "node:crypto";

import { getMarketingAttribution } from "@/lib/marketing/attribution";
import { marketingPublicConfig } from "@/lib/marketing/config";

/**
 * Server-side purchase conversions. Fired from the Stripe webhook so the value
 * is exact and the event survives ad-blockers / iOS pixel loss. Each platform
 * call is env-gated and best-effort: a failure is logged but never throws, so a
 * tracking outage can't break checkout fulfilment.
 *
 * De-duplication: the browser pixels fire the same Purchase with the same
 * `orderId` as event id, so Meta/GA4/TikTok merge the two into one conversion.
 *
 * Google Ads is intentionally NOT here — robust server-side import needs the
 * Google Ads API (OAuth + developer token). Phase 0 covers Google via the
 * browser conversion + Enhanced Conversions on the success page.
 */

function sha256(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export type PurchaseConversion = {
  userId: string;
  email?: string | null;
  value: number;
  currency: string;
  orderId: string;
  sourceUrl?: string;
};

export async function sendPurchaseConversions(input: PurchaseConversion) {
  const attribution = await getMarketingAttribution(input.userId);
  const eventTimeSec = Math.floor(Date.now() / 1000);

  await Promise.allSettled([
    sendMetaCapi(input, attribution, eventTimeSec),
    sendGa4Purchase(input),
    sendTiktokEvent(input, attribution, eventTimeSec),
  ]);
}

async function sendMetaCapi(
  input: PurchaseConversion,
  attribution: Awaited<ReturnType<typeof getMarketingAttribution>>,
  eventTimeSec: number,
) {
  const pixelId = marketingPublicConfig.metaPixelId;
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (!pixelId || !token) return;

  const userData: Record<string, unknown> = {};
  const em = sha256(input.email);
  if (em) userData.em = [em];
  if (attribution?.fbp) userData.fbp = attribution.fbp;
  if (attribution?.fbc) userData.fbc = attribution.fbc;

  const body = {
    data: [
      {
        event_name: "Purchase",
        event_time: eventTimeSec,
        event_id: input.orderId,
        action_source: "website",
        event_source_url: input.sourceUrl,
        user_data: userData,
        custom_data: { currency: input.currency, value: input.value },
      },
    ],
    ...(process.env.META_TEST_EVENT_CODE
      ? { test_event_code: process.env.META_TEST_EVENT_CODE }
      : {}),
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) {
      console.error("[Conversions] Meta CAPI failed:", res.status, await res.text());
    }
  } catch (err) {
    console.error("[Conversions] Meta CAPI error:", err);
  }
}

async function sendGa4Purchase(input: PurchaseConversion) {
  const measurementId = marketingPublicConfig.ga4Id;
  const apiSecret = process.env.GA4_API_SECRET;
  if (!measurementId || !apiSecret) return;

  // No browser _ga cookie server-side → derive a stable GA4-shaped client_id
  // ("<int>.<int>") from the user id. Records the conversion; perfect
  // session-stitch would require capturing the _ga cookie (Phase 1).
  const hash = createHash("sha256").update(input.userId).digest();
  const clientId = `${hash.readUInt32BE(0)}.${hash.readUInt32BE(4)}`;

  const body = {
    client_id: clientId,
    user_id: input.userId,
    events: [
      {
        name: "purchase",
        params: {
          currency: input.currency,
          value: input.value,
          transaction_id: input.orderId,
        },
      },
    ],
  };

  try {
    const res = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) {
      console.error("[Conversions] GA4 MP failed:", res.status);
    }
  } catch (err) {
    console.error("[Conversions] GA4 MP error:", err);
  }
}

async function sendTiktokEvent(
  input: PurchaseConversion,
  attribution: Awaited<ReturnType<typeof getMarketingAttribution>>,
  eventTimeSec: number,
) {
  const pixelId = marketingPublicConfig.tiktokPixelId;
  const token = process.env.TIKTOK_EVENTS_ACCESS_TOKEN;
  if (!pixelId || !token) return;

  const user: Record<string, unknown> = {};
  const em = sha256(input.email);
  if (em) user.email = em;
  if (attribution?.ttclid) user.ttclid = attribution.ttclid;

  const body = {
    event_source: "web",
    event_source_id: pixelId,
    data: [
      {
        event: "CompletePayment",
        event_time: eventTimeSec,
        event_id: input.orderId,
        user,
        properties: {
          currency: input.currency,
          value: input.value,
          content_type: "product",
        },
      },
    ],
  };

  try {
    const res = await fetch(
      "https://business-api.tiktok.com/open_api/v1.3/event/track/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "Access-Token": token },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) {
      console.error("[Conversions] TikTok Events failed:", res.status);
    }
  } catch (err) {
    console.error("[Conversions] TikTok Events error:", err);
  }
}
