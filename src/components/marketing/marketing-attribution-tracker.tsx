"use client";

/**
 * Captures the paid-ad touch into the first-party `dralvo_attr` cookie.
 *
 * Touch policy: LAST touch that carries any UTM/click-id wins (overwrites the
 * cookie) so click-ids stay fresh for the conversion APIs. Plain organic visits
 * (no tracking params) never clobber an existing ad touch. The server side
 * (attribution claim) preserves first_seen_at separately.
 *
 * This is deliberately the inverse of the affiliate/partner first-touch rule —
 * direct-response ad ROAS credits the click that drove the action.
 */

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

const ATTR_COOKIE = "dralvo_attr";
const COOKIE_DAYS = 90;

const PARAM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid",
  "ttclid",
] as const;

function setCookie(name: string, value: string, days: number) {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; path=/; SameSite=Lax`;
}

export function MarketingAttributionTracker() {
  const searchParams = useSearchParams();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;

    const touch: Record<string, string> = {};
    for (const key of PARAM_KEYS) {
      const value = searchParams?.get(key);
      if (value) touch[key] = value.slice(0, 256);
    }

    // No tracking params on this URL → leave any existing ad touch untouched.
    if (Object.keys(touch).length === 0) return;

    fired.current = true;

    touch.landing_url = window.location.href.slice(0, 512);
    touch.referrer = document.referrer.slice(0, 512);

    setCookie(ATTR_COOKIE, JSON.stringify(touch), COOKIE_DAYS);
  }, [searchParams]);

  return null;
}
