import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dralvo.com";

const disallow = [
  "/api/",
  "/auth/",
  "/dashboard/",
  "/login",
  "/reset-password",
  "/signup",
];

// LLM / AI answer-engine crawlers we explicitly welcome (Generative Engine
// Optimization). Listing them with allow:"/" signals intent and guards against
// any future blanket block. Private app paths stay disallowed for everyone.
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "anthropic-ai",
  "Claude-Web",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Amazonbot",
  "Bytespider",
  "CCBot",
  "cohere-ai",
  "Meta-ExternalAgent",
  "DuckAssistBot",
  "MistralAI-User",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: "/", disallow })),
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
