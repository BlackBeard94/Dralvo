import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/shared/theme-toggle";

import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dralvo.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Dralvo - Drill Into Gold",
    template: "%s | Dralvo",
  },
  description:
    "Dralvo is an XAUUSD analysis SaaS for gold-specific indicators, dashboard context, and trader-safe market intelligence.",
  keywords: [
    "Dralvo",
    "XAUUSD",
    "gold trading",
    "gold analysis",
    "technical analysis",
    "SGE Premium",
    "COT report",
    "COMEX inventory",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Dralvo - Drill Into Gold",
    description:
      "Gold-specific market context for XAUUSD traders. Informational only, not financial advice.",
    url: "/",
    siteName: "Dralvo",
    type: "website",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dralvo - Drill Into Gold",
    description:
      "Gold-specific market context for XAUUSD traders. Informational only, not financial advice.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.svg",
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
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}
