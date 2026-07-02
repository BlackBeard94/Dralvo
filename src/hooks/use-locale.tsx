"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  DEFAULT_LOCALE,
  LOCALE_CHANGE_EVENT,
  LOCALE_COOKIE,
  LOCALE_STORAGE_KEY,
  localeDir,
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
 * Resolve the locale on the client: an explicit user choice (localStorage)
 * always wins; otherwise auto-select by the visitor's country (edge-geo
 * cookie), then the browser language, then the server-provided fallback (which
 * itself already accounts for cookie / country / Accept-Language).
 */
function readLocale(fallback: SupportedLocale): SupportedLocale {
  if (typeof window === "undefined") return fallback;

  const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (saved) return normalizeLocale(saved);

  const byCountry = localeForCountry(readCountryCookie());
  if (byCountry) return byCountry;

  if (navigator.language) return normalizeLocale(navigator.language);

  return fallback;
}

/** Apply the locale to <html lang/dir> + cookie (for SSR), WITHOUT persisting an
 *  explicit choice — so country auto-detection keeps working until the user
 *  actively picks a language. */
function applyLocale(locale: SupportedLocale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.lang = locale;
  document.documentElement.dir = localeDir(locale);
}

/** Record an explicit user choice — this one writes localStorage so it sticks. */
function persistLocale(locale: SupportedLocale) {
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  applyLocale(locale);
}

type LocaleContextValue = {
  locale: SupportedLocale;
  setLocale: (next: SupportedLocale) => void;
  mounted: boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * Seeds the locale from the server (so SSR markup and the first client render
 * agree — no hydration mismatch and correct language/dir for SEO), then
 * reconciles once mounted with client-only signals (an explicit localStorage
 * choice made in another tab, etc.).
 */
export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: SupportedLocale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<SupportedLocale>(initialLocale);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const resolved = readLocale(initialLocale);
    applyLocale(resolved);
    setLocaleState(resolved);
    setMounted(true);

    const onLocaleChange = (event: Event) => {
      const next = (event as CustomEvent<SupportedLocale>).detail;
      setLocaleState(normalizeLocale(next));
    };
    window.addEventListener(LOCALE_CHANGE_EVENT, onLocaleChange);
    return () =>
      window.removeEventListener(LOCALE_CHANGE_EVENT, onLocaleChange);
    // initialLocale is a stable server value for the life of the document.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLocale = useCallback(
    (next: SupportedLocale) => {
      persistLocale(next);
      setLocaleState(next);
      window.dispatchEvent(
        new CustomEvent<SupportedLocale>(LOCALE_CHANGE_EVENT, { detail: next }),
      );
      // Re-render server components (legal pages, affiliate, blog, …) with the
      // new locale cookie without a full reload; client components already
      // updated via the context state above.
      router.refresh();
    },
    [router],
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, mounted }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (ctx) return ctx;
  // Defensive fallback for any consumer rendered outside the provider: behaves
  // like the pre-provider hook (default locale, no-op setter) rather than
  // throwing, so an isolated tree never crashes.
  return {
    locale: DEFAULT_LOCALE,
    setLocale: () => {},
    mounted: false,
  };
}
