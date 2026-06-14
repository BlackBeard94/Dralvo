"use client";

import { usePathname } from "next/navigation";

import { LanguageSwitcher } from "@/components/shared/language-switcher";

const pagesWithHeaderSwitcher = new Set(["/", "/pricing"]);

export function GlobalLanguageSwitcher() {
  const pathname = usePathname();

  if (pagesWithHeaderSwitcher.has(pathname)) {
    return null;
  }

  return <LanguageSwitcher />;
}
