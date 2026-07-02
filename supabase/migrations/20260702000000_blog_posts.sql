-- Blog: multilingual, admin-authored (Supabase) articles for SEO + GEO.
-- One row per (slug, locale) so each language version is its own record and can
-- be cross-linked via hreflang. Writes go through the service-role admin client;
-- the public reads only PUBLISHED rows (RLS).

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             text NOT NULL,
  locale           text NOT NULL,                 -- en, vi, pt-BR, es, zh, hi, id, ru
  title            text NOT NULL,
  excerpt          text,                           -- short summary / TL;DR (GEO)
  body             text NOT NULL DEFAULT '',       -- Markdown
  cover_image_url  text,
  tags             text[] NOT NULL DEFAULT '{}',
  author           text NOT NULL DEFAULT 'Dralvo',
  meta_title       text,
  meta_description text,
  faq              jsonb NOT NULL DEFAULT '[]'::jsonb,  -- [{"q":..,"a":..}] → FAQPage schema
  status           text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  reading_minutes  integer NOT NULL DEFAULT 3,
  published_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (slug, locale)
);

CREATE INDEX IF NOT EXISTS blog_posts_status_published_idx
  ON public.blog_posts(status, published_at DESC);
CREATE INDEX IF NOT EXISTS blog_posts_slug_idx ON public.blog_posts(slug);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
-- Anyone (anon/authenticated) may read PUBLISHED posts. Drafts + all writes are
-- service-role only (admin panel), which bypasses RLS.
DROP POLICY IF EXISTS "Public can read published blog posts" ON public.blog_posts;
CREATE POLICY "Public can read published blog posts"
  ON public.blog_posts FOR SELECT
  USING (status = 'published');
