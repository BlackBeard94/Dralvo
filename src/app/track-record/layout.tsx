import type { Metadata } from "next";

import { GOLDMASTER } from "@/lib/backtest-stats";

export const metadata: Metadata = {
  title: "Track Record — Verified XAUUSD Gold Robot Results",
  description:
    "Dralvo's public track record for its gold (XAUUSD) trading robots — verified on real / 100%-real-tick MetaTrader 5 data. Win rate, profit factor, longest losing streak, and maximum drawdown published openly. Past performance does not guarantee future results.",
  alternates: { canonical: "/track-record" },
  openGraph: {
    title: "Dralvo Track Record — Verified XAUUSD Gold Robot Results",
    description:
      "Public, verified backtest results for Dralvo's gold (XAUUSD) robots on real-tick MT5 data — win rate, profit factor, longest losing streak, and max drawdown.",
    url: "/track-record",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dralvo Track Record — Verified XAUUSD Gold Robot Results",
    description:
      "Public, verified backtest results on real-tick MT5 data — win rate, profit factor, and max drawdown published openly.",
  },
};

// JSON-LD built from the SAME canonical source the page renders (GOLDMASTER in
// backtest-stats.ts), so structured data can never drift from the visible numbers.
const gm = GOLDMASTER;
const stat = (k: string) => gm.tradeStats.find((s) => s.key === k)?.value ?? "";
const star = gm.riskMatrix.find((r) => r.star);
const finalBalance = gm.finalBalance.split("→").pop()?.trim() ?? gm.finalBalance;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Dataset",
  name: `${gm.name} — 8-year XAUUSD backtest (MT5 Strategy Tester)`,
  description:
    "Verified MetaTrader 5 Strategy Tester results for the Dralvo GoldMaster XAUUSD (gold) trading robot over ~8 years (Jul 2018–Jun 2026) at the recommended 5% risk: total return, profit factor, win rate, maximum drawdown, and trade count. Past performance does not guarantee future results.",
  url: "https://www.dralvo.com/track-record",
  creator: {
    "@type": "Organization",
    name: "Dralvo Capital",
    url: "https://www.dralvo.com",
  },
  temporalCoverage: "2018-07/2026-06",
  measurementTechnique: `MetaTrader 5 Strategy Tester (XAUUSD, ${gm.timeframe}, $10,000 basis, ${gm.recommendedRisk} risk)`,
  variableMeasured: [
    { "@type": "PropertyValue", name: "Total return", value: gm.headline[0].value },
    { "@type": "PropertyValue", name: "Profit factor", value: gm.headline[1].value },
    { "@type": "PropertyValue", name: "Win rate", value: stat("winRate") },
    { "@type": "PropertyValue", name: "Max drawdown (equity)", value: gm.headline[3].value },
    { "@type": "PropertyValue", name: "Trades", value: stat("trades") },
    { "@type": "PropertyValue", name: "CAGR", value: star?.extra ?? "" },
    { "@type": "PropertyValue", name: "Reward:Risk", value: stat("rr") },
    { "@type": "PropertyValue", name: "Final balance", value: finalBalance },
  ],
};

export default function TrackRecordLayout({
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
