import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Suspense } from "react";

import { AuthHashRedirect } from "@/components/shared/auth-hash-redirect";
import { GlobalLanguageSwitcher } from "@/components/shared/global-language-switcher";
import { GlobalThemeToggle } from "@/components/shared/global-theme-toggle";
import { PartnerReferralTracker } from "@/components/attribution/partner-referral-tracker";
import { ServiceWorkerRegister } from "@/components/shared/service-worker-register";
import { PartnerConversionTracker } from "@/components/attribution/partner-conversion-tracker";
import { MarketingPixels } from "@/components/marketing/marketing-pixels";
import { MarketingAttributionTracker } from "@/components/marketing/marketing-attribution-tracker";
import { MarketingAttributionClaim } from "@/components/marketing/marketing-attribution-claim";
import { MarketingPurchaseTracker } from "@/components/marketing/marketing-purchase-tracker";
import { TelegramChatButton } from "@/components/shared/telegram-chat-button";
import { LocaleProvider } from "@/hooks/use-locale";
import { localeDir } from "@/lib/i18n";
import { getServerLocale } from "@/lib/server-locale";
import { cn } from "@/lib/utils";

import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dralvo.com";

// ponytail: native viewport — fixes all mobile rendering globally
export const viewport = { width: "device-width", initialScale: 1, themeColor: "#D4A843" };

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Dralvo — Automated XAUUSD Gold Trading Robots for MetaTrader 5",
    template: "%s | Dralvo",
  },
  description:
    "Dralvo builds verified automated gold (XAUUSD) trading robots for MetaTrader 5: GoldMaster (D1 swing), GoldScalp (M15 momentum) and the free TiGold engine. Strategies verified on real market data — no martingale, no grid. Start free via Dralvo IB, or unlock everything with Dralvo VIP from $59/month.",
  keywords: [
    "Dralvo",
    "Dralvo GoldMaster",
    "Dralvo GoldScalp",
    "Dralvo TiGold",
    "Dralvo VIP",
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
      "Verified gold (XAUUSD) trading robots for MT5: GoldMaster (D1 swing), GoldScalp (M15 momentum) and the free TiGold engine. No martingale, no grid. Free via Dralvo IB or Dralvo VIP from $59/mo.",
    url: "/",
    siteName: "Dralvo",
    type: "website",
    images: ["/brand/dralvo-og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dralvo — Automated XAUUSD Gold Trading Robots for MetaTrader 5",
    description:
      "Verified gold (XAUUSD) trading robots for MT5: GoldMaster, GoldScalp and the free TiGold engine. No martingale, no grid. Free via Dralvo IB or Dralvo VIP from $59/mo.",
    images: ["/brand/dralvo-og.png"],
  },
  robots: { index: true, follow: true },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Dralvo",
  },
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();

  return (
    <html
      lang={locale}
      dir={localeDir(locale)}
      className={cn("dark", geist.variable)}
      suppressHydrationWarning
    >
      <head>
        {/* Fonts via <link> in <head> (preconnect + stylesheet) — earlier in the
            HTML and not gated behind CSS parsing, so much less render-blocking
            than a globals.css @import. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- intentional:
            loaded once in the root layout (applies to every route), placed in <head>
            to minimize render-blocking vs a globals.css @import. */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap"
        />
        {/* No-flash theme: apply the user's saved (or preferred) theme before first
            paint so light-mode users don't see a dark flash. Mirrors ThemeToggle. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('dralvo-theme');if(t==='light'||(!t&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches)){document.documentElement.setAttribute('data-theme','light');}}catch(e){}})();",
          }}
        />
      </head>
      <body className="bg-deep text-text-primary antialiased">
        <LocaleProvider initialLocale={locale}>
          <ServiceWorkerRegister />
          <AuthHashRedirect />
          {/* Partner (reseller) attribution: ?p=CODE → cookie → first-touch claim.
            Mutually exclusive with affiliate tracking. */}
          <Suspense fallback={null}>
            <PartnerReferralTracker />
          </Suspense>
          <PartnerConversionTracker />
          {/* Paid-ads tracking: pixels + UTM/click-id capture + post-checkout
            purchase conversion. All no-op until the ad ids are set in env. */}
          <MarketingPixels />
          <Suspense fallback={null}>
            <MarketingAttributionTracker />
          </Suspense>
          <MarketingAttributionClaim />
          <Suspense fallback={null}>
            <MarketingPurchaseTracker />
          </Suspense>
          {/* Language + theme controls, pinned top-right on pages without a header
            (login, signup, reset-password, legal, …). Each child self-hides on
            pages that have their own header switcher. */}
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
            <GlobalLanguageSwitcher />
            <GlobalThemeToggle />
          </div>
          {children}
          <TelegramChatButton />
        </LocaleProvider>
      </body>
    </html>
  );
}
