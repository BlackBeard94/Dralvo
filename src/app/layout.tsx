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
    default: "Dralvo - Trading Systems. Real Data. Real Results.",
    template: "%s | Dralvo",
  },
  description:
    "Dralvo builds XAUUSD trading systems with real data, transparent testing, and disciplined signal tracking.",
  keywords: [
    "Dralvo",
    "XAUUSD EA",
    "gold trading bot",
    "MT5 EA",
    "automated gold trading",
    "gold expert advisor",
    "robot giao dich vang",
    "EA vang",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Dralvo - Trading Systems. Real Data. Real Results.",
    description:
      "XAUUSD trading systems, real market data, transparent testing, and signal tracking.",
    url: "/",
    siteName: "Dralvo",
    type: "website",
    images: ["/brand/dralvo-og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dralvo - Trading Systems. Real Data. Real Results.",
    description:
      "XAUUSD trading systems, real market data, transparent testing, and signal tracking.",
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
