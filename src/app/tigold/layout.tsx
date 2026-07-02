import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TiGold — Free Automated XAUUSD Gold Robot for MT5",
  description:
    "Get Dralvo TiGold free through the Dralvo IB partnership — an adaptive XAUUSD (gold) trading robot for MetaTrader 5. Three-layer capital protection, smart trailing stop, and a hard stop-loss on every trade. No martingale, no grid. 1,105 trades verified over 6 months of real-tick data.",
  alternates: { canonical: "/tigold" },
  openGraph: {
    title: "Dralvo TiGold — Free XAUUSD Gold Trading Robot for MetaTrader 5",
    description:
      "Free via the Dralvo IB partnership. Adaptive XAUUSD robot for MT5 with 3-layer capital protection and a hard stop-loss on every trade. No martingale, no grid.",
    url: "/tigold",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dralvo TiGold — Free XAUUSD Gold Trading Robot for MT5",
    description:
      "Free via the Dralvo IB partnership. Adaptive XAUUSD robot for MT5. No martingale, no grid — hard stop-loss on every trade.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Dralvo TiGold",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Windows (MetaTrader 5)",
  url: "https://www.dralvo.com/tigold",
  description:
    "A free adaptive XAUUSD (gold) trading robot for MetaTrader 5, available at no cost through the Dralvo IB partnership. Three-layer capital protection, smart trailing stop, hard stop-loss on every trade — no martingale, no grid.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  isAccessibleForFree: true,
  publisher: {
    "@type": "Organization",
    name: "Dralvo Capital",
    url: "https://www.dralvo.com",
  },
};

export default function TigoldLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
