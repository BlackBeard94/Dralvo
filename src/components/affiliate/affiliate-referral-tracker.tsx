"use client";

/**
 * Landing page affiliate link detector.
 * Detects ?ref=CODE in URL, generates a visitorId, and calls the tracking API.
 * Include on landing page and any public page that can be a referral landing point.
 */

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

function getOrCreateVisitorId(): string {
  const key = "dralvo_vid";
  let vid = localStorage.getItem(key);
  if (!vid) {
    vid = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(key, vid);
  }
  return vid;
}

export function AffiliateReferralTracker() {
  const searchParams = useSearchParams();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;

    const refCode = searchParams?.get("ref");
    if (!refCode) return;

    fired.current = true;
    const visitorId = getOrCreateVisitorId();

    fetch("/api/affiliate/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: refCode, visitorId }),
    }).catch(() => {});
  }, [searchParams]);

  return null;
}
