import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dralvo.com";
const lastModified = new Date("2026-06-27");

export default function sitemap(): MetadataRoute.Sitemap {
  const primary = ["", "/tigold", "/track-record", "/tools/calculator", "/compare"];
  const legal = ["/privacy", "/terms", "/disclaimer"];

  return [
    ...primary.map((route) => ({
      url: `${siteUrl}${route}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.8,
    })),
    ...legal.map((route) => ({
      url: `${siteUrl}${route}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    })),
  ];
}
