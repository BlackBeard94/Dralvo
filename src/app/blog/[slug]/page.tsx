import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteNav } from "@/components/shared/site-nav";
import { SiteFooter } from "@/components/shared/site-footer";
import { GlowOrb, GridPattern } from "@/components/shared/decor";
import { getServerLocale } from "@/lib/server-locale";
import { isSupportedLocale, localeDir, type SupportedLocale } from "@/lib/i18n";
import { getPostForSlug, getPublishedLocalesForSlug, getPublishedCards } from "@/lib/blog/server";
import { renderMarkdown, extractHeadings, toPlainText } from "@/lib/blog/markdown";
import { BLOG_UI } from "@/lib/blog/ui-copy";
import type { BlogPost } from "@/lib/blog/types";

export const revalidate = 300; // ISR: refresh published content every 5 min

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.dralvo.com";
const SERIF = "'DM Serif Display', 'Times New Roman', 'Noto Serif', serif";

type Params = { slug: string };
type Search = { hl?: string };

async function resolveLocale(search: Search): Promise<SupportedLocale> {
  if (isSupportedLocale(search.hl)) return search.hl;
  return getServerLocale();
}

function canonicalFor(slug: string, locale: SupportedLocale, hlPresent: boolean): string {
  return hlPresent ? `${SITE}/blog/${slug}?hl=${locale}` : `${SITE}/blog/${slug}`;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}): Promise<Metadata> {
  const { slug } = await params;
  const search = await searchParams;
  const locale = await resolveLocale(search);
  const post = await getPostForSlug(slug, locale);
  if (!post) return { title: "Not found", robots: { index: false, follow: false } };

  const title = post.meta_title || post.title;
  const description = post.meta_description || post.excerpt || toPlainText(post.body, 160);
  const locales = await getPublishedLocalesForSlug(slug);
  const languages: Record<string, string> = {};
  for (const l of locales) languages[l] = `${SITE}/blog/${slug}?hl=${l}`;
  languages["x-default"] = `${SITE}/blog/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalFor(slug, post.locale, !!search.hl),
      languages,
    },
    openGraph: {
      type: "article",
      title,
      description,
      url: canonicalFor(slug, post.locale, !!search.hl),
      siteName: "Dralvo",
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      authors: [post.author],
      tags: post.tags,
      images: [post.cover_image_url || "/brand/dralvo-og.png"],
      locale: post.locale,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [post.cover_image_url || "/brand/dralvo-og.png"],
    },
    robots: { index: true, follow: true },
  };
}

function jsonLd(post: BlogPost, url: string, ui: (typeof BLOG_UI)["en"]) {
  const graph: Record<string, unknown>[] = [
    {
      "@type": "BlogPosting",
      "@id": `${url}#article`,
      headline: post.title,
      description: post.meta_description || post.excerpt || toPlainText(post.body, 200),
      image: post.cover_image_url || `${SITE}/brand/dralvo-og.png`,
      datePublished: post.published_at ?? post.created_at,
      dateModified: post.updated_at,
      inLanguage: post.locale,
      author: { "@type": "Organization", name: post.author, url: SITE },
      publisher: {
        "@type": "Organization",
        name: "Dralvo",
        logo: { "@type": "ImageObject", url: `${SITE}/brand/dralvo-icon-180.png` },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      keywords: post.tags.join(", "),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: ui.home, item: SITE },
        { "@type": "ListItem", position: 2, name: ui.eyebrow, item: `${SITE}/blog` },
        { "@type": "ListItem", position: 3, name: post.title, item: url },
      ],
    },
  ];
  if (post.faq.length > 0) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: post.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
}

export default async function BlogArticlePage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const { slug } = await params;
  const search = await searchParams;
  const locale = await resolveLocale(search);
  const post = await getPostForSlug(slug, locale);
  if (!post) notFound();

  const ui = BLOG_UI[post.locale];
  const html = renderMarkdown(post.body);
  const headings = extractHeadings(post.body);
  const url = canonicalFor(slug, post.locale, !!search.hl);
  const dateFmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString(post.locale, { year: "numeric", month: "long", day: "numeric" }) : "";

  // Other published posts (best locale), newest first, excluding this one.
  const others = (await getPublishedCards(post.locale)).filter((c) => c.slug !== post.slug).slice(0, 6);

  return (
    <div dir={localeDir(post.locale)} className="min-h-dvh bg-deep">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(post, url, ui) }} />

      <SiteNav locale={post.locale} activeHref="/blog" />

      <main className="relative overflow-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <GridPattern />
        <GlowOrb className="w-[520px] h-[520px] -right-40 -top-40 opacity-30" />

        <div
          className={
            others.length > 0
              ? "relative z-10 mx-auto grid max-w-[1120px] grid-cols-1 gap-12 px-6 pt-16 pb-10 lg:grid-cols-[minmax(0,760px)_300px] lg:justify-center"
              : "relative z-10 mx-auto max-w-[760px] px-6 pt-16 pb-10"
          }
        >
        <article className="min-w-0">
          <Link href="/blog" className="text-[13px] text-text-muted no-underline hover:text-gold">
            {ui.backToBlog}
          </Link>

          {post.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {post.tags.map((t) => (
                <span key={t} className="rounded-full border border-border bg-surface/60 px-2.5 py-1 text-[11px] uppercase tracking-wider text-text-muted">
                  {t}
                </span>
              ))}
            </div>
          )}

          <h1
            className="mt-4 text-4xl sm:text-5xl leading-[1.08] tracking-[-0.015em] text-text-primary text-balance"
            style={{ fontFamily: SERIF }}
          >
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="mt-5 text-lg leading-relaxed text-text-secondary">{post.excerpt}</p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-text-muted">
            <span>{post.author}</span>
            <span aria-hidden>·</span>
            <span>{dateFmt(post.published_at)}</span>
            <span aria-hidden>·</span>
            <span>{post.reading_minutes} {ui.minRead}</span>
          </div>

          {post.cover_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.cover_image_url}
              alt={post.title}
              className="mt-8 w-full rounded-2xl border border-border object-cover"
            />
          )}

          {headings.length >= 3 && (
            <nav aria-label={ui.tableOfContents} className="mt-10 rounded-2xl border border-border bg-surface/50 p-5">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">
                {ui.tableOfContents}
              </p>
              <ul className="space-y-1.5">
                {headings.map((h) => (
                  <li key={h.id} className={h.level === 3 ? "ml-4" : ""}>
                    <a href={`#${h.id}`} className="text-sm text-text-secondary no-underline hover:text-gold">
                      {h.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <div
            className="prose-blog mt-10"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          {post.faq.length > 0 && (
            <section className="mt-14 border-t border-border pt-10">
              <h2 className="text-2xl text-text-primary" style={{ fontFamily: SERIF }}>{ui.faqTitle}</h2>
              <div className="mt-6 space-y-4">
                {post.faq.map((f, i) => (
                  <details key={i} className="rounded-xl border border-border bg-surface/50 p-4">
                    <summary className="cursor-pointer text-[15px] font-semibold text-text-primary">{f.q}</summary>
                    <p className="mt-2 text-sm leading-relaxed text-text-secondary">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* Product CTA — internal linking for SEO + conversion */}
          <aside className="mt-14 rounded-2xl border border-border-gold bg-gold/[0.06] p-6 text-center">
            <h2 className="text-xl text-text-primary" style={{ fontFamily: SERIF }}>{ui.ctaTitle}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">{ui.ctaBody}</p>
            <Link
              href="/#pricing"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gold-action px-5 py-2.5 text-sm font-semibold text-[#060609] no-underline hover:bg-gold-actionHover"
            >
              {ui.ctaButton}
            </Link>
          </aside>
        </article>

        {/* Sidebar — other articles (sticky on desktop, stacks below on mobile) */}
        {others.length > 0 && (
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">
              {ui.moreArticles}
            </p>
            <ul className="space-y-3">
              {others.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/blog/${c.slug}`}
                    className="group flex gap-3 rounded-xl border border-border bg-card/60 p-3 no-underline transition-colors hover:border-border-gold"
                  >
                    {c.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.cover_image_url}
                        alt={c.title}
                        className="h-14 w-14 shrink-0 rounded-lg object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-14 w-14 shrink-0 rounded-lg bg-gradient-to-br from-gold/15 to-surface" />
                    )}
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-text-primary group-hover:text-gold">
                        {c.title}
                      </h3>
                      <p className="mt-1 text-[11px] text-text-muted">
                        {c.reading_minutes} {ui.minRead}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}
        </div>
      </main>

      <SiteFooter locale={post.locale} />
    </div>
  );
}
