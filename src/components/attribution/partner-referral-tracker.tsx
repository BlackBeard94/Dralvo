"use client";

/**
 * Partner (reseller) link detector. Mirrors the affiliate referral tracker.
 * Detects ?p=CODE in the URL and sets the `dralvo_partner` cookie — but ONLY
 * if NO referral cookie of EITHER kind already exists (first-touch wins,
 * "đến trước thì bên đó ăn"). Affiliate and partner are mutually exclusive.
 */

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

const PARTNER_COOKIE = "dralvo_partner";
const AFFILIATE_COOKIE = "dralvo_ref";
const COOKIE_DAYS = 60;

function hasCookie(name: string): boolean {
  if (typeof document === "undefined") return false;
  return new RegExp(`(?:^|; )${name}=`).test(document.cookie);
}

function setCookie(name: string, value: string, days: number) {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; path=/`;
}

export function PartnerReferralTracker() {
  const searchParams = useSearchParams();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;

    const code = searchParams?.get("p");
    if (!code) return;

    fired.current = true;

    // First-touch: do not overwrite an existing referral of either kind.
    if (hasCookie(AFFILIATE_COOKIE) || hasCookie(PARTNER_COOKIE)) return;

    setCookie(PARTNER_COOKIE, code, COOKIE_DAYS);
  }, [searchParams]);

  return null;
}
