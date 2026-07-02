/**
 * GET/POST/DELETE /api/admin/blog — admin CRUD for blog posts.
 * Gated by the marketing scope (blog is content marketing); super_admin passes.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getAdmin, can } from "@/lib/admin/auth";
import { isSupportedLocale } from "@/lib/i18n";
import { adminListPosts, adminGetPost, adminUpsertPost, adminDeletePost, type BlogUpsertInput } from "@/lib/blog/server";
import { readingMinutes, slugify } from "@/lib/blog/markdown";
import type { BlogFaq } from "@/lib/blog/types";

async function guard() {
  const admin = await getAdmin();
  if (!admin || !can(admin, "marketing.view")) return null;
  return admin;
}

export async function GET(request: NextRequest) {
  if (!(await guard())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (id) {
    const post = await adminGetPost(id);
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ post });
  }
  return NextResponse.json({ posts: await adminListPosts() });
}

export async function POST(request: NextRequest) {
  if (!(await guard())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const slug = slugify(String(body.slug ?? ""));
  const title = String(body.title ?? "").trim();
  const locale = String(body.locale ?? "");
  const status = body.status === "published" ? "published" : "draft";

  if (!slug) return NextResponse.json({ error: "slug_required" }, { status: 400 });
  if (!title) return NextResponse.json({ error: "title_required" }, { status: 400 });
  if (!isSupportedLocale(locale)) return NextResponse.json({ error: "invalid_locale" }, { status: 400 });

  const bodyMd = String(body.body ?? "");
  const faq: BlogFaq[] = Array.isArray(body.faq)
    ? (body.faq as unknown[])
        .map((f) => f as { q?: unknown; a?: unknown })
        .filter((f) => f && typeof f.q === "string" && typeof f.a === "string" && f.q.trim() && f.a.trim())
        .map((f) => ({ q: String(f.q).trim(), a: String(f.a).trim() }))
    : [];

  const input: BlogUpsertInput = {
    id: typeof body.id === "string" && body.id ? body.id : undefined,
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
    const code = result.error === "duplicate_slug_locale" ? 409 : result.error === "not_found" ? 404 : 500;
    return NextResponse.json({ error: result.error }, { status: code });
  }
  return NextResponse.json({ success: true, post: result.post });
}

export async function DELETE(request: NextRequest) {
  if (!(await guard())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: "id_required" }, { status: 400 });
  const ok = await adminDeletePost(body.id);
  if (!ok) return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  return NextResponse.json({ success: true });
}
