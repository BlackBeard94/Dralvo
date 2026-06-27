import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { AuthHashRedirect } from "@/components/shared/auth-hash-redirect";
import { GlobalLanguageSwitcher } from "@/components/shared/global-language-switcher";
import { GlobalThemeToggle } from "@/components/shared/global-theme-toggle";
import { cn } from "@/lib/utils";

import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dralvo.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Dralvo — Automated XAUUSD Gold Trading Robots for MetaTrader 5",
    template: "%s | Dralvo",
  },
  description:
    "Dralvo builds verified automated gold (XAUUSD) trading robots for MetaTrader 5: GoldMaster (D1 swing), GoldScalp (M5 momentum) and the free TiGold engine. Strategies verified on real market data — no martingale, no grid. Start free via Dralvo IB, or unlock everything with Dralvo Unlimited from $59/month.",
  keywords: [
    "Dralvo",
    "Dralvo GoldMaster",
    "Dralvo GoldScalp",
    "Dralvo TiGold",
    "Dralvo Unlimited",
    "XAUUSD EA",
    "gold trading robot",
    "MT5 gold expert advisor",
    "automated gold trading",
    "XAUUSD trading bot",
    "no martingale gold EA",
    "robot giao dich vang",
    "EA vang XAUUSD",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Dralvo — Automated XAUUSD Gold Trading Robots for MetaTrader 5",
    description:
      "Verified gold (XAUUSD) trading robots for MT5: GoldMaster (D1 swing), GoldScalp (M5 momentum) and the free TiGold engine. No martingale, no grid. Free via Dralvo IB or Dralvo Unlimited from $59/mo.",
    url: "/",
    siteName: "Dralvo",
    type: "website",
    images: ["/brand/dralvo-og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dralvo — Automated XAUUSD Gold Trading Robots for MetaTrader 5",
    description:
      "Verified gold (XAUUSD) trading robots for MT5: GoldMaster, GoldScalp and the free TiGold engine. No martingale, no grid. Free via Dralvo IB or Dralvo Unlimited from $59/mo.",
    images: ["/brand/dralvo-og.png"],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/brand/dralvo-icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/dralvo-icon-48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [
      {
        url: "/brand/dralvo-icon-180.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark", geist.variable)} suppressHydrationWarning>
      <body className="bg-deep text-text-primary antialiased">
        <AuthHashRedirect />
        <GlobalLanguageSwitcher />
        <GlobalThemeToggle />
        {children}
      </body>
    </html>
  );
}
