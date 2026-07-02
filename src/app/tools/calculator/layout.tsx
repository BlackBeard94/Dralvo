import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gold (XAUUSD) Position Size & Risk Calculator",
  description:
    "Free XAUUSD position-size, lot, and risk-reward calculator for MetaTrader 5 traders. Work out the right lot size for your account balance and risk percentage, and check risk-per-trade before you enter. Runs in the browser — no account required.",
  alternates: { canonical: "/tools/calculator" },
  openGraph: {
    title: "Free Gold (XAUUSD) Position Size & Risk Calculator — Dralvo",
    description:
      "Calculate lot size, risk-per-trade, and risk-reward for XAUUSD on MetaTrader 5. Free, browser-based, no account required.",
    url: "/tools/calculator",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Gold (XAUUSD) Position Size & Risk Calculator — Dralvo",
    description:
      "Calculate lot size, risk-per-trade, and risk-reward for XAUUSD on MT5. Free and browser-based.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Gold (XAUUSD) Position Size & Risk Calculator",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Any (web browser)",
  url: "https://www.dralvo.com/tools/calculator",
  description:
    "Free XAUUSD position-size, lot, and risk-reward calculator for MetaTrader 5 traders. Work out the right lot size for your account balance and risk percentage, and check risk-per-trade before entering. Runs in the browser — no account required.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  isAccessibleForFree: true,
  publisher: {
    "@type": "Organization",
    name: "Dralvo Capital",
    url: "https://www.dralvo.com",
  },
};

export default function CalculatorLayout({
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
