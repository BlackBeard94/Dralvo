/**
 * Machine API for external writing agents (e.g. Paperclip) to draft & publish
 * blog posts WITHOUT a browser session. Authenticated by a bearer API key, not
 * the admin cookie.
 *
 *   Authorization: Bearer <BLOG_AGENT_API_KEY>   (or  x-api-key: <key>)
 *
 * GET  ?action=guidelines → the content contract + SEO/GEO writing rules + the
 *                           list of existing slugs (so the agent avoids dupes).
 * GET  (or ?action=list)  → existing posts (slug, locale, status).
 * POST                    → upsert a post (idempotent on slug+locale).
 *
 * Safety: publishing is gated by BLOG_AGENT_ALLOW_PUBLISH — unless it is "true"
 * every agent write is forced to DRAFT so a human reviews before it goes live.
 */
import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";
import { isSupportedLocale, SUPPORTED_LOCALES } from "@/lib/i18n";
import { adminListPosts, adminUpsertPost, type BlogUpsertInput } from "@/lib/blog/server";
import { readingMinutes, slugify } from "@/lib/blog/markdown";
import { BLOG_AGENT_GUIDELINES } from "@/lib/blog/agent-guidelines";
import { verifyBlogAgent } from "@/lib/agent/keys";
import type { BlogFaq } from "@/lib/blog/types";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.dralvo.com";

export async function GET(request: NextRequest) {
  if (!(await verifyBlogAgent(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const action = new URL(request.url).searchParams.get("action") ?? "list";
  const posts = await adminListPosts();

  if (action === "guidelines") {
    return NextResponse.json({
      ...BLOG_AGENT_GUIDELINES,
      site: SITE,
      supported_locales: SUPPORTED_LOCALES,
      // Let the agent see what already exists so it doesn't duplicate slugs.
      existing: posts.map((p) => ({ slug: p.slug, locale: p.locale, status: p.status, title: p.title })),
    });
  }

  return NextResponse.json({
    posts: posts.map((p) => ({
      slug: p.slug,
      locale: p.locale,
      status: p.status,
      title: p.title,
      url: `${SITE}/blog/${p.slug}?hl=${p.locale}`,
      updated_at: p.updated_at,
    })),
  });
}

export async function POST(request: NextRequest) {
  const rl = checkRateLimit({ key: rateLimitKey(request, "agent:blog"), limit: 30, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);
  if (!(await verifyBlogAgent(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const slug = slugify(String(body.slug ?? ""));
  const title = String(body.title ?? "").trim();
  const locale = String(body.locale ?? "");
  if (!slug) return NextResponse.json({ error: "slug_required" }, { status: 400 });
  if (!title) return NextResponse.json({ error: "title_required" }, { status: 400 });
  if (!isSupportedLocale(locale)) {
    return NextResponse.json({ error: "invalid_locale", supported: SUPPORTED_LOCALES }, { status: 400 });
  }

  const bodyMd = String(body.body ?? "");
  if (bodyMd.trim().length < 200) {
    return NextResponse.json({ error: "body_too_short", hint: "Write a full article (≥ ~300 words)." }, { status: 400 });
  }

  const faq: BlogFaq[] = Array.isArray(body.faq)
    ? (body.faq as unknown[])
        .map((f) => f as { q?: unknown; a?: unknown })
        .filter((f) => f && typeof f.q === "string" && typeof f.a === "string" && f.q.trim() && f.a.trim())
        .map((f) => ({ q: String(f.q).trim(), a: String(f.a).trim() }))
    : [];

  // Publishing guardrail: force draft unless explicitly allowed via env.
  const allowPublish = process.env.BLOG_AGENT_ALLOW_PUBLISH === "true";
  const wantsPublish = body.status === "published";
  const status = wantsPublish && allowPublish ? "published" : "draft";

  const input: BlogUpsertInput = {
    slug,
    locale,
    title,
    excerpt: body.excerpt ? String(body.excerpt) : null,
    body: bodyMd,
    cover_image_url: body.cover_image_url ? String(body.cover_image_url) : null,
    tags: Array.isArray(body.tags) ? (body.tags as unknown[]).map(String).map((t) => t.trim()).filter(Boolean) : [],
    author: body.author ? String(body.author) : "Dralvo",
    meta_title: body.meta_title ? String(body.meta_title) : null,
    meta_description: body.meta_description ? String(body.meta_description) : null,
    faq,
    status,
    reading_minutes:
      typeof body.reading_minutes === "number" && body.reading_minutes > 0
        ? Math.round(body.reading_minutes)
        : readingMinutes(bodyMd),
  };

  const result = await adminUpsertPost(input);
  if (!result.ok) {
    const code = result.error === "duplicate_slug_locale" ? 409 : 500;
    return NextResponse.json({ error: result.error }, { status: code });
  }

  return NextResponse.json({
    success: true,
    status,
    published: status === "published",
    note: wantsPublish && !allowPublish
      ? "Saved as DRAFT — set BLOG_AGENT_ALLOW_PUBLISH=true to let the agent publish directly."
      : undefined,
    url: `${SITE}/blog/${result.post.slug}?hl=${result.post.locale}`,
    post: { id: result.post.id, slug: result.post.slug, locale: result.post.locale, status: result.post.status },
  });
}
