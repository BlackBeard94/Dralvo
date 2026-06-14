import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { cn } from "@/lib/utils";
import { AuthHashRedirect } from "@/components/shared/auth-hash-redirect";
import { GlobalLanguageSwitcher } from "@/components/shared/global-language-switcher";
import { GlobalThemeToggle } from "@/components/shared/global-theme-toggle";

import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dralvo.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Dralvo - Gold Decision Intelligence",
    template: "%s | Dralvo",
  },
  description:
    "Dralvo is Gold Decision Intelligence for XAUUSD: verified evidence, explainable thesis, source-backed drivers, and thesis monitors.",
  keywords: [
    "Dralvo",
    "XAUUSD",
    "gold trading",
    "gold analysis",
    "gold thesis",
    "CFTC gold positioning",
    "COT report",
    "COMEX inventory",
    "GLD holdings",
    "TIPS real yields",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Dralvo - Gold Decision Intelligence",
    description:
      "Gold Decision Intelligence for XAUUSD: verified evidence and explainable thesis. Informational only, not financial advice.",
    url: "/",
    siteName: "Dralvo",
    type: "website",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dralvo - Gold Decision Intelligence",
    description:
      "Gold Decision Intelligence for XAUUSD: verified evidence and explainable thesis. Informational only, not financial advice.",
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
        <AuthHashRedirect />
        <GlobalLanguageSwitcher />
        <GlobalThemeToggle />
        {children}
      </body>
    </html>
  );
}
