"use client";

/**
 * Persists the captured ad touch to the authenticated user's attribution row.
 *
 * Runs once per load: reads the `dralvo_attr` cookie plus Meta's pixel cookies
 * (`_fbp` / `_fbc`) and POSTs them to /api/attribution/marketing. The endpoint
 * no-ops for anonymous visitors, so this is safe to mount globally. We do NOT
 * clear the cookie afterwards — last-touch should keep refreshing the row until
 * the user converts.
 */

import { useEffect, useRef } from "react";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function MarketingAttributionClaim() {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;

    const attrRaw = getCookie("dralvo_attr");
    const fbp = getCookie("_fbp");
    const fbc = getCookie("_fbc");

    // Nothing worth persisting if there's neither an ad touch nor a Meta cookie.
    if (!attrRaw && !fbp && !fbc) return;

    fired.current = true;

    let touch: Record<string, string> = {};
    if (attrRaw) {
      try {
        touch = JSON.parse(attrRaw) as Record<string, string>;
      } catch {
        touch = {};
      }
    }

    void fetch("/api/attribution/marketing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...touch, fbp, fbc }),
      keepalive: true,
    }).catch(() => {});
  }, []);

  return null;
}
