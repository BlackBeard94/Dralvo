"use client";

/**
 * Client-side affiliate referral conversion.
 * Runs on first authenticated page load. Checks for dralvo_ref cookie,
 * calls /api/affiliate/convert, then clears the cookie to avoid double-fire.
 *
 * Include in layout.tsx of any protected route (dashboard, etc.).
 */

import { useEffect, useRef } from "react";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; Max-Age=0; path=/`;
}

export function AffiliateConversionTracker() {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;

    const refCookie = getCookie("dralvo_ref");
    if (!refCookie) return;

    const parts = refCookie.split(":");
    const visitorId = parts.length > 1 ? parts[1] : null;
    if (!visitorId) return;

    fired.current = true;

    fetch("/api/affiliate/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId }),
    })
      .then(() => deleteCookie("dralvo_ref"))
      .catch(() => {});
  }, []);

  return null;
}
