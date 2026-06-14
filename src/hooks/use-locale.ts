"use client";

import { useCallback, useEffect, useState } from "react";

import {
  DEFAULT_LOCALE,
  LOCALE_CHANGE_EVENT,
  LOCALE_COOKIE,
  LOCALE_STORAGE_KEY,
  normalizeLocale,
  type SupportedLocale,
} from "@/lib/i18n";

function readLocale() {
  if (typeof window === "undefined") return DEFAULT_LOCALE;

  return normalizeLocale(
    localStorage.getItem(LOCALE_STORAGE_KEY) ?? navigator.language,
  );
}

function persistLocale(locale: SupportedLocale) {
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.lang = locale;
}

export function useLocale() {
  const [locale, setLocaleState] = useState<SupportedLocale>(DEFAULT_LOCALE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initial = readLocale();
    persistLocale(initial);
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
