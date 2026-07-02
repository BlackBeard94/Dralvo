import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { FALLBACK_LOCALE, isSupportedLocale, type SupportedLocale } from "@/lib/i18n";
import type { BlogPost, BlogPostCard, BlogStatus, BlogFaq } from "./types";

const SELECT =
  "id, slug, locale, title, excerpt, body, cover_image_url, tags, author, meta_title, meta_description, faq, status, reading_minutes, published_at, created_at, updated_at";

type Row = Record<string, unknown>;

function rowToPost(r: Row): BlogPost {
  const faqRaw = r.faq;
  const faq: BlogFaq[] = Array.isArray(faqRaw)
    ? (faqRaw as BlogFaq[]).filter((f) => f && f.q && f.a)
    : [];
  return {
    id: String(r.id),
    slug: String(r.slug),
    locale: (isSupportedLocale(r.locale as string) ? r.locale : FALLBACK_LOCALE) as SupportedLocale,
    title: String(r.title ?? ""),
    excerpt: (r.excerpt as string | null) ?? null,
    body: String(r.body ?? ""),
    cover_image_url: (r.cover_image_url as string | null) ?? null,
    tags: Array.isArray(r.tags) ? (r.tags as string[]) : [],
    author: String(r.author ?? "Dralvo"),
    meta_title: (r.meta_title as string | null) ?? null,
    meta_description: (r.meta_description as string | null) ?? null,
    faq,
    status: (r.status as BlogStatus) ?? "draft",
    reading_minutes: Number(r.reading_minutes ?? 3),
    published_at: (r.published_at as string | null) ?? null,
    created_at: String(r.created_at ?? ""),
    updated_at: String(r.updated_at ?? ""),
  };
}

/** Pick, per slug, the best available locale: requested → fallback → any. */
function preferLocale(rows: BlogPost[], locale: SupportedLocale): BlogPost {
  return (
    rows.find((r) => r.locale === locale) ??
    rows.find((r) => r.locale === FALLBACK_LOCALE) ??
    rows[0]
  );
}

/** Published posts for the blog index — one card per slug in the best locale. */
export async function getPublishedCards(locale: SupportedLocale): Promise<BlogPostCard[]> {
  const sb = getSupabaseAdminClient();
  if (!sb) return [];
  const { data } = await sb
    .from("blog_posts")
    .select(SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const bySlug = new Map<string, BlogPost[]>();
  for (const r of (data ?? []) as Row[]) {
    const p = rowToPost(r);
    (bySlug.get(p.slug) ?? bySlug.set(p.slug, []).get(p.slug)!).push(p);
  }
  const cards = [...bySlug.values()].map((rows) => preferLocale(rows, locale));
  cards.sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));
  return cards.map((p) => ({
    slug: p.slug,
    locale: p.locale,
    title: p.title,
    excerpt: p.excerpt,
    cover_image_url: p.cover_image_url,
    tags: p.tags,
    reading_minutes: p.reading_minutes,
    published_at: p.published_at,
    author: p.author,
  }));
}

/** A published post by slug in the best available locale (or null). */
export async function getPostForSlug(
  slug: string,
  locale: SupportedLocale,
): Promise<BlogPost | null> {
  const sb = getSupabaseAdminClient();
  if (!sb) return null;
  const { data } = await sb
    .from("blog_posts")
    .select(SELECT)
    .eq("slug", slug)
    .eq("status", "published");
  const rows = (data ?? []).map((r) => rowToPost(r as Row));
  if (rows.length === 0) return null;
  return preferLocale(rows, locale);
}

/** Locales in which a slug is published — for hreflang alternates. */
export async function getPublishedLocalesForSlug(slug: string): Promise<SupportedLocale[]> {
  const sb = getSupabaseAdminClient();
  if (!sb) return [];
  const { data } = await sb
    .from("blog_posts")
    .select("locale")
    .eq("slug", slug)
    .eq("status", "published");
  return (data ?? [])
    .map((r) => (r as Row).locale as string)
    .filter(isSupportedLocale);
}

/** All published (slug, locale, updated_at) for the sitemap. */
export async function getSitemapEntries(): Promise<
  { slug: string; locale: SupportedLocale; updated_at: string }[]
> {
  const sb = getSupabaseAdminClient();
  if (!sb) return [];
  const { data } = await sb
    .from("blog_posts")
    .select("slug, locale, updated_at")
    .eq("status", "published");
  return (data ?? [])
    .map((r) => r as Row)
    .filter((r) => isSupportedLocale(r.locale as string))
    .map((r) => ({
      slug: String(r.slug),
      locale: r.locale as SupportedLocale,
      updated_at: String(r.updated_at ?? ""),
    }));
}

/** Recent published cards (best-locale) for the RSS feed. */
export async function getRecentForFeed(locale: SupportedLocale, limit = 20): Promise<BlogPostCard[]> {
  const cards = await getPublishedCards(locale);
  return cards.slice(0, limit);
}

/* ------------------------------------------------------------------ */
/*  Admin CRUD (service-role, called from admin API only)             */
/* ------------------------------------------------------------------ */

export async function adminListPosts(): Promise<BlogPost[]> {
  const sb = getSupabaseAdminClient();
  if (!sb) return [];
  const { data } = await sb.from("blog_posts").select(SELECT).order("updated_at", { ascending: false });
  return (data ?? []).map((r) => rowToPost(r as Row));
}

export async function adminGetPost(id: string): Promise<BlogPost | null> {
  const sb = getSupabaseAdminClient();
  if (!sb) return null;
  const { data } = await sb.from("blog_posts").select(SELECT).eq("id", id).maybeSingle();
  return data ? rowToPost(data as Row) : null;
}

export type BlogUpsertInput = {
  id?: string;
  slug: string;
  locale: SupportedLocale;
  title: string;
  excerpt?: string | null;
  body: string;
  cover_image_url?: string | null;
  tags?: string[];
  author?: string;
  meta_title?: string | null;
  meta_description?: string | null;
  faq?: BlogFaq[];
  status: BlogStatus;
  reading_minutes: number;
};

export async function adminUpsertPost(
  input: BlogUpsertInput,
): Promise<{ ok: true; post: BlogPost } | { ok: false; error: string }> {
  const sb = getSupabaseAdminClient();
  if (!sb) return { ok: false, error: "server_error" };

  const now = new Date().toISOString();
  const row: Record<string, unknown> = {
    slug: input.slug,
    locale: input.locale,
    title: input.title,
    excerpt: input.excerpt ?? null,
    body: input.body,
    cover_image_url: input.cover_image_url ?? null,
    tags: input.tags ?? [],
    author: input.author ?? "Dralvo",
    meta_title: input.meta_title ?? null,
    meta_description: input.meta_description ?? null,
    faq: input.faq ?? [],
    status: input.status,
    reading_minutes: input.reading_minutes,
    updated_at: now,
    // Stamp published_at the first time it goes live.
    published_at: input.status === "published" ? now : null,
  };

  // On update, don't clobber an existing published_at if still published.
  if (input.id) {
    const existing = await adminGetPost(input.id);
    if (existing?.published_at && input.status === "published") {
      row.published_at = existing.published_at;
    }
    const { data, error } = await sb
      .from("blog_posts")
      .update(row)
      .eq("id", input.id)
      .select(SELECT)
      .maybeSingle();
    if (error) return { ok: false, error: error.code === "23505" ? "duplicate_slug_locale" : error.message };
    if (!data) return { ok: false, error: "not_found" };
    return { ok: true, post: rowToPost(data as Row) };
  }

  const { data, error } = await sb.from("blog_posts").insert(row).select(SELECT).single();
  if (error) return { ok: false, error: error.code === "23505" ? "duplicate_slug_locale" : error.message };
  return { ok: true, post: rowToPost(data as Row) };
}

export async function adminDeletePost(id: string): Promise<boolean> {
  const sb = getSupabaseAdminClient();
  if (!sb) return false;
  const { error } = await sb.from("blog_posts").delete().eq("id", id);
  return !error;
}
