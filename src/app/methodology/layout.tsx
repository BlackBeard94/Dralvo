import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "How Dralvo sources, evaluates, and limits the evidence behind its gold market thesis.",
  alternates: {
    canonical: "/methodology",
  },
};

export default function MethodologyLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
