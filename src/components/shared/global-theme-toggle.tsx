"use client";

import { usePathname } from "next/navigation";

import { ThemeToggle } from "@/components/shared/theme-toggle";

const pagesWithHeaderToggle = new Set(["/", "/pricing"]);

export function GlobalThemeToggle() {
  const pathname = usePathname();

  if (pagesWithHeaderToggle.has(pathname)) {
    return null;
  }

  return <ThemeToggle />;
}
