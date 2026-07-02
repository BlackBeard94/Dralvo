import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getPartner } from "@/lib/partners/auth";
import { PartnerShell } from "@/components/partner/partner-shell";

export const metadata: Metadata = {
  title: "Partner — Dralvo",
  robots: { index: false, follow: false },
};

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const partner = await getPartner();
  if (!partner) redirect("/dashboard");

  return (
    <PartnerShell name={partner.name} code={partner.code}>
      {children}
    </PartnerShell>
  );
}
