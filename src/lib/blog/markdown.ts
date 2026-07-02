import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

/** URL-safe slug from heading text (for anchor ids / table of contents). */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

// Give headings stable ids so they can be linked / used in a ToC (helps SEO
// deep-links and GEO answer extraction).
marked.use({
  gfm: true,
  renderer: {
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens);
      const id = slugify(text.replace(/<[^>]+>/g, ""));
      return `<h${depth} id="${id}">${text}</h${depth}>\n`;
    },
  },
});

/** Render trusted-author Markdown to sanitized HTML (server-side). */
export function renderMarkdown(md: string): string {
  const raw = marked.parse(md ?? "", { async: false }) as string;
  return sanitizeHtml(raw, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "img", "h1", "h2", "figure", "figcaption",
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "title", "loading", "width", "height"],
      "*": ["id"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      // External links open safely; internal (relative) links stay in-tab.
      a: (tagName, attribs) => {
        const href = attribs.href ?? "";
        const external = /^https?:\/\//i.test(href) && !href.includes("dralvo.com");
        return {
          tagName,
          attribs: external
            ? { ...attribs, target: "_blank", rel: "noopener noreferrer" }
            : attribs,
        };
      },
      img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: "lazy" } }),
    },
  });
}

/** Estimate reading time in minutes from Markdown (~200 wpm). */
export function readingMinutes(md: string): number {
  const words = (md ?? "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export type Heading = { id: string; text: string; level: 2 | 3 };

/** Extract h2/h3 headings for a table of contents (regex over the Markdown). */
export function extractHeadings(md: string): Heading[] {
  const out: Heading[] = [];
  for (const line of (md ?? "").split("\n")) {
    const m = /^(#{2,3})\s+(.+?)\s*#*$/.exec(line.trim());
    if (m) {
      const text = m[2].replace(/[*_`]/g, "").trim();
      out.push({ id: slugify(text), text, level: m[1].length as 2 | 3 });
    }
  }
  return out;
}

/** Plain-text summary from Markdown (for meta description fallback). */
export function toPlainText(md: string, max = 160): string {
  const text = (md ?? "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? text.slice(0, max - 1).trimEnd() + "…" : text;
}
