import Link from "next/link";

import { NavBar } from "@/components/shared/nav-bar";
import { mainNavLinks } from "@/components/shared/nav-links";
import { COMMON_COPY } from "@/lib/common-copy";
import type { SupportedLocale } from "@/lib/i18n";

/** The 3 header action buttons, shared by every page's nav (matches landing).
 *  Pure presentational — the caller supplies the locale (client via useLocale,
 *  server via getServerLocale) so this module stays free of server-only APIs. */
export function MainNavActions({ locale }: { locale: SupportedLocale }) {
  const t = COMMON_COPY[locale].actions;
  return (
    <>
      <Link href="/#pricing" className="rounded-md bg-gold-action px-2 py-1 text-[12px] font-semibold text-[#060609] no-underline transition-all duration-200 hover:bg-gold-actionHover">
        {t.freeTrial}
      </Link>
      <Link href="/signup" className="rounded-md bg-gold-bright px-2 py-1 text-[12px] font-semibold text-[#060609] no-underline transition-all duration-200 hover:bg-gold-actionHover">
        {t.signUp}
      </Link>
      <Link href="/login" className="rounded-md border border-border px-2 py-1 text-[12px] font-semibold text-text-primary transition-all hover:border-gold/40 hover:text-gold no-underline">
        {t.signIn}
      </Link>
    </>
  );
}

/**
 * The site's primary navigation bar — identical menu + action buttons as the
 * landing page — so every secondary page (affiliate, blog, tigold, …) shows the
 * same header. Pass the current locale and the current page's href (to
 * highlight it in the menu).
 */
export function SiteNav({
  locale,
  activeHref,
}: {
  locale: SupportedLocale;
  activeHref?: string;
}) {
  return (
    <NavBar
      navClassName="sticky top-0 z-50 bg-deep/85 backdrop-blur-xl border-b border-border"
      wordmarkClassName="text-2xl font-black transition-colors group-hover:text-text-primary"
      containerClassName="max-w-[1180px] mx-auto px-6"
      links={mainNavLinks(locale, activeHref)}
      actions={<MainNavActions locale={locale} />}
    />
  );
}
