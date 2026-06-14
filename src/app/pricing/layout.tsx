import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Compare Dralvo Free and Pro access for source-backed gold evidence, thesis monitoring, replay, and exports.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Dralvo Pricing",
    description:
      "One Free plan and one Pro plan for explainable gold decision intelligence.",
    url: "/pricing",
  },
};

export default function PricingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
