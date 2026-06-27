import type { Metadata } from "next";

import { COMPARE_COPY } from "@/lib/compare-copy";
import { CompareContent } from "./compare-content";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.dralvo.com";

export const metadata: Metadata = {
  title: "Dralvo vs Grid & Martingale Gold EAs — An Honest Comparison",
  description:
    "How Dralvo's XAUUSD robots (GoldMaster, GoldScalp, TiGold) differ from grid and martingale gold EAs: a hard stop-loss on every trade vs averaging down, bounded vs catastrophic drawdown, and published backtests vs hidden logic.",
  alternates: { canonical: "/compare" },
  openGraph: {
    title: "Dralvo vs Grid & Martingale Gold EAs",
    description:
      "Hard stop-loss vs averaging down. Bounded vs catastrophic drawdown. Published backtests vs hidden logic. An honest comparison of Dralvo's MT5 gold robots against grid/martingale EAs.",
    url: "/compare",
    type: "article",
    images: ["/brand/dralvo-og.png"],
  },
};

export default function ComparePage() {
  // Structured data is always English (canonical for GEO), rendered into the
  // initial server HTML; the visible UI localizes client-side via useLocale().
  const en = COMPARE_COPY.en;
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "Dralvo vs Grid & Martingale Gold EAs — An Honest Comparison",
        about: "Comparison of Dralvo's MetaTrader 5 XAUUSD trading robots against grid and martingale Expert Advisors",
        author: { "@type": "Organization", name: "Dralvo Capital", url: siteUrl },
        publisher: { "@type": "Organization", name: "Dralvo Capital", url: siteUrl },
        mainEntityOfPage: `${siteUrl}/compare`,
        inLanguage: "en",
      },
      {
        "@type": "FAQPage",
        mainEntity: en.faq.map(([q, a]) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <CompareContent />
    </>
  );
}
