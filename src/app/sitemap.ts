import type { MetadataRoute } from "next";
import { getSitemapEntries } from "@/lib/blog/server";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dralvo.com";
const lastModified = new Date("2026-07-02");

export const revalidate = 3600; // rebuild the sitemap hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const primary = ["", "/tigold", "/pricing", "/track-record", "/tools/calculator", "/compare", "/methodology", "/blog", "/affiliate"];
  const legal = ["/privacy", "/terms", "/disclaimer"];

  const staticEntries: MetadataRoute.Sitemap = [
    ...primary.map((route) => ({
      url: `${siteUrl}${route}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : route === "/blog" ? 0.7 : 0.8,
    })),
    ...legal.map((route) => ({
      url: `${siteUrl}${route}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    })),
  ];

  // Blog posts — one entry per slug (canonical URL) with per-locale hreflang
  // alternates so search engines index every language version.
  const entries = await getSitemapEntries();
  const bySlug = new Map<string, { locales: Set<string>; updated: string }>();
  for (const e of entries) {
    const cur = bySlug.get(e.slug) ?? { locales: new Set<string>(), updated: e.updated_at };
    cur.locales.add(e.locale);
    if (e.updated_at > cur.updated) cur.updated = e.updated_at;
    bySlug.set(e.slug, cur);
  }

  const blogEntries: MetadataRoute.Sitemap = [...bySlug.entries()].map(([slug, v]) => {
    const languages: Record<string, string> = {};
    for (const l of v.locales) languages[l] = `${siteUrl}/blog/${slug}?hl=${l}`;
    languages["x-default"] = `${siteUrl}/blog/${slug}`;
    return {
      url: `${siteUrl}/blog/${slug}`,
      lastModified: v.updated ? new Date(v.updated) : lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
      alternates: { languages },
    };
  });

  return [...staticEntries, ...blogEntries];
}
