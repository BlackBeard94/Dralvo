"use client";

/**
 * Client-side partner attribution claim. Mirrors the affiliate conversion
 * tracker. Runs on first authenticated page load: if a `dralvo_partner` cookie
 * is present, POSTs the code to /api/attribution/claim, then clears the cookie
 * to avoid double-fire. The claim endpoint is itself first-touch idempotent.
 */

import { useEffect, useRef } from "react";

const PARTNER_COOKIE = "dralvo_partner";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; Max-Age=0; path=/`;
}

export function PartnerConversionTracker() {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;

    const code = getCookie(PARTNER_COOKIE);
    if (!code) return;

    fired.current = true;

    fetch("/api/attribution/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
      .then(() => deleteCookie(PARTNER_COOKIE))
      .catch(() => {});
  }, []);

  return null;
}
