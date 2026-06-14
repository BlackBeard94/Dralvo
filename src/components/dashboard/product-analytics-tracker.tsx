"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { useLocale } from "@/hooks/use-locale";

export function ProductAnalyticsTracker() {
  const pathname = usePathname();
  const { locale } = useLocale();

  useEffect(() => {
    if (!pathname.startsWith("/dashboard")) return;
    const key = `dralvo:view:${pathname}`;
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");

    void fetch("/api/analytics/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event_name: "dashboard_view",
        route_path: pathname,
        properties: { locale },
      }),
      keepalive: true,
    });
  }, [locale, pathname]);

  return null;
}
