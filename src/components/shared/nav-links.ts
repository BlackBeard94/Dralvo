import type { NavLink } from "@/components/shared/nav-bar";
import { COMMON_COPY } from "@/lib/common-copy";
import type { SupportedLocale } from "@/lib/i18n";

/**
 * Primary site navigation, shared by the landing page and secondary pages
 * (affiliate, blog, …) so every page shows the full menu. Hrefs are absolute
 * (`/#section`) so the anchors resolve from any page, not just the homepage.
 * Labels are localized from {@link COMMON_COPY}; pass the current page's href to
 * highlight it (gold) in the menu.
 */
export function mainNavLinks(
  locale: SupportedLocale,
  activeHref?: string,
): NavLink[] {
  const t = COMMON_COPY[locale].nav;
  const links: NavLink[] = [
    { label: t.products, href: "/#products", showFrom: "sm" },
    { label: t.performance, href: "/#evidence", showFrom: "sm" },
    { label: t.tools, href: "/#fx-tool", showFrom: "md" },
    {
      label: t.tigold,
      href: "/tigold",
      showFrom: "md",
      className: "font-semibold",
      style: { color: "#00c98d" },
    },
    { label: t.pricing, href: "/#pricing", showFrom: "sm" },
    { label: t.blog, href: "/blog", showFrom: "md" },
    { label: t.affiliate, href: "/affiliate", showFrom: "sm" },
  ];

  if (!activeHref) return links;
  return links.map((l) =>
    l.href === activeHref
      ? { ...l, className: "text-gold font-semibold", style: undefined }
      : l,
  );
}
