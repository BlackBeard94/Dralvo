"use client";

import { usePathname } from "next/navigation";

import { ThemeToggle } from "@/components/shared/theme-toggle";

const pagesWithHeaderToggle = new Set(["/", "/pricing", "/tools/backtest"]);

export function GlobalThemeToggle() {
  const pathname = usePathname();

  if (pagesWithHeaderToggle.has(pathname) || pathname.startsWith("/dashboard")) {
    return null;
  }

  return <ThemeToggle />;
}
