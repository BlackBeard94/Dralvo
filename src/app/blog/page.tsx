import type { Metadata } from "next";
import Link from "next/link";

import { SiteNav } from "@/components/shared/site-nav";
import { SiteFooter } from "@/components/shared/site-footer";
import { GlowOrb, GridPattern } from "@/components/shared/decor";
import { getServerLocale } from "@/lib/server-locale";
import { localeDir } from "@/lib/i18n";
import { getPublishedCards } from "@/lib/blog/server";
import { BLOG_UI } from "@/lib/blog/ui-copy";

export const revalidate = 300;

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.dralvo.com";
const SERIF = "'DM Serif Display', 'Times New Roman', 'Noto Serif', serif";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const ui = BLOG_UI[locale];
  return {
    title: ui.indexTitle,
    description: ui.indexIntro,
    alternates: { canonical: `${SITE}/blog` },
    openGraph: {
      type: "website",
      title: `${ui.indexTitle} | Dralvo`,
      description: ui.indexIntro,
      url: `${SITE}/blog`,
      siteName: "Dralvo",
      images: ["/brand/dralvo-og.png"],
    },
    robots: { index: true, follow: true },
  };
}

export default async function BlogIndexPage() {
  const locale = await getServerLocale();
  const ui = BLOG_UI[locale];
  const cards = await getPublishedCards(locale);

  const listLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Blog",
    name: ui.indexTitle,
    url: `${SITE}/blog`,
    inLanguage: locale,
    blogPost: cards.slice(0, 20).map((c) => ({
      "@type": "BlogPosting",
      headline: c.title,
      url: `${SITE}/blog/${c.slug}`,
      datePublished: c.published_at ?? undefined,
      author: { "@type": "Organization", name: c.author },
    })),
  });

  return (
    <div dir={localeDir(locale)} className="min-h-dvh bg-deep">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: listLd }} />

      <SiteNav locale={locale} activeHref="/blog" />

      <main className="relative overflow-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <GridPattern />
        <GlowOrb className="w-[560px] h-[560px] -right-40 -top-40 opacity-30" />

        <section className="relative z-10 mx-auto max-w-[1100px] px-6 pt-16 pb-8">
          <span className="text-[12px] uppercase tracking-[0.18em] text-gold">{ui.eyebrow}</span>
          <h1 className="mt-3 max-w-[820px] text-4xl sm:text-5xl leading-[1.08] tracking-[-0.015em] text-text-primary text-balance" style={{ fontFamily: SERIF }}>
            {ui.indexTitle}
          </h1>
          <p className="mt-5 max-w-[680px] text-lg leading-relaxed text-text-secondary">{ui.indexIntro}</p>
        </section>

        <section className="relative z-10 mx-auto max-w-[1100px] px-6 pb-24">
          {cards.length === 0 ? (
            <p className="rounded-2xl border border-border bg-surface/50 p-10 text-center text-text-muted">{ui.empty}</p>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((c) => (
                <Link
                  key={c.slug}
                  href={`/blog/${c.slug}`}
                  className="card-elevate group flex flex-col overflow-hidden rounded-2xl border border-border bg-card no-underline transition-colors hover:border-border-gold"
                >
                  {c.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.cover_image_url} alt={c.title} className="h-44 w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="h-44 w-full bg-gradient-to-br from-gold/10 to-surface" />
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    {c.tags[0] && (
                      <span className="mb-2 text-[11px] uppercase tracking-wider text-gold">{c.tags[0]}</span>
                    )}
                    <h2 className="text-lg font-semibold leading-snug text-text-primary group-hover:text-gold">{c.title}</h2>
                    {c.excerpt && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-text-muted">{c.excerpt}</p>}
                    <div className="mt-4 flex items-center gap-2 text-[12px] text-text-muted">
                      <span>{c.published_at ? new Date(c.published_at).toLocaleDateString(locale) : ""}</span>
                      <span aria-hidden>·</span>
                      <span>{c.reading_minutes} {ui.minRead}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}
