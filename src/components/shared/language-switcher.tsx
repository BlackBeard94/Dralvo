"use client";

import { Languages } from "lucide-react";

import { useLocale } from "@/hooks/use-locale";
import {
  DEFAULT_LOCALE,
  LOCALE_LABELS,
  LOCALE_SHORT_LABELS,
  SUPPORTED_LOCALES,
} from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, mounted } = useLocale();

  const switchLocale = () => {
    const currentIndex = SUPPORTED_LOCALES.indexOf(locale);
    const next = SUPPORTED_LOCALES[(currentIndex + 1) % SUPPORTED_LOCALES.length] ?? DEFAULT_LOCALE;
    setLocale(next);
  };

  if (!mounted) {
    return <div className={cn("theme-toggle opacity-0", className)} aria-hidden="true" />;
  }

  return (
    <button
      type="button"
      className={cn("theme-toggle gap-1.5 px-2 text-[11px] font-semibold", className)}
      onClick={switchLocale}
      aria-label={`Switch language. Current language: ${LOCALE_LABELS[locale]}`}
      title={LOCALE_LABELS[locale]}
    >
      <Languages size={14} aria-hidden="true" />
      <span>{LOCALE_SHORT_LABELS[locale]}</span>
    </button>
  );
}
