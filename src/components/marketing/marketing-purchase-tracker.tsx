"use client";

/**
 * Fires the browser-side Purchase conversion after a successful Stripe
 * checkout. The success route redirects to /dashboard?checkout=success with the
 * order id (oid) and value (v/cur). We fire once per order id (sessionStorage
 * guard) and let the event id dedupe against the server-side CAPI/Events copy.
 */

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

import { trackPurchase } from "@/lib/marketing/track";

export function MarketingPurchaseTracker() {
  const searchParams = useSearchParams();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    if (searchParams?.get("checkout") !== "success") return;

    const orderId = searchParams.get("oid");
    if (!orderId) return;

    const key = `dralvo:purchase:${orderId}`;
    if (window.sessionStorage.getItem(key)) return;

    fired.current = true;
    window.sessionStorage.setItem(key, "1");

    trackPurchase({
      orderId,
      value: Number(searchParams.get("v") ?? 0),
      currency: searchParams.get("cur") ?? "USD",
    });
  }, [searchParams]);

  return null;
}
