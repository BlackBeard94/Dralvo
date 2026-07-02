import type { SupportedLocale } from "@/lib/i18n";

export type BlogStatus = "draft" | "published";

export type BlogFaq = { q: string; a: string };

export interface BlogPost {
  id: string;
  slug: string;
  locale: SupportedLocale;
  title: string;
  excerpt: string | null;
  body: string; // markdown
  cover_image_url: string | null;
  tags: string[];
  author: string;
  meta_title: string | null;
  meta_description: string | null;
  faq: BlogFaq[];
  status: BlogStatus;
  reading_minutes: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Trimmed shape for list/index views. */
export type BlogPostCard = Pick<
  BlogPost,
  "slug" | "locale" | "title" | "excerpt" | "cover_image_url" | "tags" | "reading_minutes" | "published_at" | "author"
>;
