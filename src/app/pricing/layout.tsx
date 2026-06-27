import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Rent Dralvo gold trading robots for MetaTrader 5 — start free via Dralvo IB or unlock the full ecosystem with Dralvo Unlimited from $59/month.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Dralvo Pricing — Rent Gold Trading Robots for MT5",
    description:
      "Free via Dralvo IB or Dralvo Unlimited from $59/month. Cancel anytime.",
    url: "/pricing",
  },
};

export default function PricingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
