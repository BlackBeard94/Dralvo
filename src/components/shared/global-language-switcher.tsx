"use client";

import { usePathname } from "next/navigation";

import { LanguageSwitcher } from "@/components/shared/language-switcher";

const pagesWithHeaderSwitcher = new Set(["/", "/pricing", "/tools/backtest"]);

export function GlobalLanguageSwitcher() {
  const pathname = usePathname();

  if (pagesWithHeaderSwitcher.has(pathname) || pathname.startsWith("/dashboard")) {
    return null;
  }

  return <LanguageSwitcher />;
}
