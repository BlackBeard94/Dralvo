import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dralvo.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/dashboard", "/privacy", "/terms", "/disclaimer"];

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date("2026-06-06"),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
