import { getServerLocale } from "@/lib/server-locale";
import { getRecentForFeed } from "@/lib/blog/server";
import { BLOG_UI } from "@/lib/blog/ui-copy";

export const revalidate = 900;

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.dralvo.com";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  const locale = await getServerLocale();
  const ui = BLOG_UI[locale];
  const cards = await getRecentForFeed(locale, 20);

  const items = cards
    .map((c) => {
      const url = `${SITE}/blog/${c.slug}`;
      const date = c.published_at ? new Date(c.published_at).toUTCString() : new Date().toUTCString();
      return `    <item>
      <title>${esc(c.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${date}</pubDate>
      ${c.excerpt ? `<description>${esc(c.excerpt)}</description>` : ""}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(ui.indexTitle)} | Dralvo</title>
    <link>${SITE}/blog</link>
    <description>${esc(ui.indexIntro)}</description>
    <language>${locale}</language>
    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=900, s-maxage=900",
    },
  });
}
