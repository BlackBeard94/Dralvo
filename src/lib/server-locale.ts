import { cookies, headers } from "next/headers";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isSupportedLocale,
  localeForCountry,
  normalizeLocale,
  type SupportedLocale,
} from "./i18n";

/**
 * Resolve the locale for server-side rendering. Mirrors the client resolution
 * order in `useLocale` so the SSR markup matches the first client render:
 *   1. an explicit choice persisted in the `dralvo-locale` cookie,
 *   2. the visitor's country (edge-geo `dralvo-country` cookie),
 *   3. the `Accept-Language` request header,
 *   4. the default locale.
 * Keeping this in sync avoids hydration mismatches and lets the very first
 * (cookie-less) visit still render in a sensible language for SEO.
 */
export async function getServerLocale(): Promise<SupportedLocale> {
  const cookieStore = await cookies();

  const explicit = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isSupportedLocale(explicit)) return explicit;

  const byCountry = localeForCountry(cookieStore.get("dralvo-country")?.value);
  if (byCountry) return byCountry;

  const accept = (await headers()).get("accept-language");
  const first = accept?.split(",")[0]?.trim();
  if (first) return normalizeLocale(first);

  return DEFAULT_LOCALE;
}
