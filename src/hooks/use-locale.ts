"use client";

import { useCallback, useEffect, useState } from "react";

import {
  DEFAULT_LOCALE,
  LOCALE_CHANGE_EVENT,
  LOCALE_COOKIE,
  LOCALE_STORAGE_KEY,
  localeForCountry,
  normalizeLocale,
  type SupportedLocale,
} from "@/lib/i18n";

function readCountryCookie(): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)dralvo-country=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

/**
 * Resolve the locale: an explicit user choice (localStorage) always wins;
 * otherwise auto-select by the visitor's country (edge-geo cookie), then fall
 * back to the browser language, then the default.
 */
function readLocale(): SupportedLocale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;

  const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (saved) return normalizeLocale(saved);

  const byCountry = localeForCountry(readCountryCookie());
  if (byCountry) return byCountry;

  return normalizeLocale(navigator.language);
}

/** Apply the locale to <html lang> + cookie (for SSR), WITHOUT persisting an
 *  explicit choice — so country auto-detection keeps working until the user
 *  actively picks a language. */
function applyLocale(locale: SupportedLocale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.lang = locale;
}

/** Record an explicit user choice — this one writes localStorage so it sticks. */
function persistLocale(locale: SupportedLocale) {
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  applyLocale(locale);
}

export function useLocale() {
  const [locale, setLocaleState] = useState<SupportedLocale>(DEFAULT_LOCALE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initial = readLocale();
    applyLocale(initial);
    setLocaleState(initial);
    setMounted(true);

    const onLocaleChange = (event: Event) => {
      const next = (event as CustomEvent<SupportedLocale>).detail;
      setLocaleState(normalizeLocale(next));
    };
    window.addEventListener(LOCALE_CHANGE_EVENT, onLocaleChange);
    return () => window.removeEventListener(LOCALE_CHANGE_EVENT, onLocaleChange);
  }, []);

  const setLocale = useCallback((next: SupportedLocale) => {
    persistLocale(next);
    setLocaleState(next);
    window.dispatchEvent(
      new CustomEvent<SupportedLocale>(LOCALE_CHANGE_EVENT, { detail: next }),
    );
  }, []);

  return { locale, setLocale, mounted };
}
