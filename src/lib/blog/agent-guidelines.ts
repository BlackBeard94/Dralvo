/**
 * The contract + writing rules a blog-writing agent should follow. Served by
 * GET /api/agent/blog?action=guidelines so an agent can self-orient in one call.
 */
export const BLOG_AGENT_GUIDELINES = {
  purpose:
    "Write SEO- and GEO-optimized articles for Dralvo (automated XAUUSD gold trading robots / MetaTrader 5 Expert Advisors). Goal: rank in organic search AND get cited by AI answer engines (ChatGPT, Perplexity, Google AI Overviews).",

  authoritative_facts_url:
    "Fetch product facts from /llms.txt before writing — never invent products, prices, or performance numbers.",

  contract: {
    endpoint: "POST /api/agent/blog",
    auth: "Authorization: Bearer <BLOG_AGENT_API_KEY>",
    idempotent_on: "slug + locale (re-POST to update the same article/translation)",
    fields: {
      slug: "kebab-case, English, stable ACROSS translations (same slug in every locale = the same article).",
      locale: "one of supported_locales.",
      title: "≤ 60 chars, contains the primary keyword, compelling.",
      excerpt: "1–2 sentence TL;DR that DIRECTLY answers the article's core question — AI engines extract this. Required.",
      body: "Markdown. See structure_rules. ~800–1500 words for pillar topics.",
      tags: "3–6 short tags, e.g. ['XAUUSD','MT5','gold EA'].",
      meta_title: "≤ 60 chars SEO title (falls back to title).",
      meta_description: "150–160 chars, includes primary keyword.",
      faq: "Array of {q,a}. 3–6 real questions, answers 1–3 sentences. Renders FAQPage schema (strong for GEO).",
      status: "'draft' or 'published' (publishing may be forced to draft by server policy).",
      cover_image_url: "optional absolute image URL.",
    },
  },

  structure_rules: [
    "Open with the TL;DR/answer in the first 1–2 sentences (also put it in `excerpt`). GEO engines quote the top.",
    "Use ## H2 for main sections and ### H3 for sub-points. Prefer question-style or descriptive headings.",
    "Short paragraphs (2–4 sentences). Use bullet lists and at most one comparison table when it helps.",
    "Include 2–4 internal Markdown links to relevant Dralvo pages (see internal_links).",
    "End the body before the FAQ — the site renders the FAQ block + product CTA automatically.",
    "Every claim must be factual and verifiable from /llms.txt. Never promise profit.",
  ],

  seo_rules: [
    "One clear primary keyword per article; place it in the title, first 100 words, one H2, meta_title and meta_description.",
    "Cover the topic thoroughly (search intent) rather than stuffing keywords.",
    "Write distinct meta_title and meta_description (don't just copy the title).",
  ],

  geo_rules: [
    "Answer the exact question a user would ask, early and plainly.",
    "Always provide a strong `faq` array — it becomes FAQPage schema that AI engines love to cite.",
    "Prefer facts, definitions, comparisons, and step-by-step lists (extractable structures).",
    "State Dralvo's differentiators plainly: no martingale, no grid, hard stop-loss on every trade, transparent real-tick backtests.",
  ],

  eeat_and_safety: [
    "Informational only — never financial advice; never guarantee returns.",
    "Emphasize transparency and risk management (Dralvo's positioning).",
    "No fabricated statistics; if unsure, omit the number.",
  ],

  internal_links: [
    { label: "Compare vs grid/martingale EAs", href: "/compare" },
    { label: "Free TiGold robot", href: "/tigold" },
    { label: "Public track record", href: "/track-record" },
    { label: "Free FX backtest tool", href: "/tools/calculator" },
    { label: "Methodology", href: "/methodology" },
    { label: "Pricing / Dralvo VIP", href: "/#pricing" },
  ],

  images: {
    upload_endpoint: "POST /api/agent/blog/upload",
    auth: "same Bearer API key",
    accepts: "multipart/form-data (field 'file') OR JSON { data_base64, content_type }",
    returns: "{ url } — a public https URL on Dralvo's own storage",
    usage:
      "If you generate an image, upload it here first, then use the returned url as cover_image_url and/or inline in the body Markdown as ![alt](url). Max 5MB; png/jpeg/webp/gif/avif. Always add descriptive alt text (SEO/accessibility).",
  },

  multilingual: "To translate an article, POST the SAME slug with a different locale. Keep meaning equivalent (localize, don't translate word-for-word).",

  example_topics: [
    "How to choose a safe XAUUSD gold EA",
    "Martingale vs no-martingale gold robots: which blows up your account?",
    "How to backtest a gold EA on real tick data (step by step)",
    "What is a hard stop-loss and why every EA needs one",
    "GoldMaster vs GoldScalp: which Dralvo robot fits your style?",
    "How the CFTC Commitment of Traders report filters gold trades",
  ],
} as const;
