import type { Metadata } from "next";

import { LegalPage, PolicySection } from "@/components/shared/legal-page";
import { LEGAL_COPY } from "@/lib/i18n";
import { getServerLocale } from "@/lib/server-locale";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Dralvo collects, uses, and protects account and platform data.",
  alternates: { canonical: "/privacy" },
};

export default async function PrivacyPage() {
  const locale = await getServerLocale();
  const legal = LEGAL_COPY[locale];
  const copy = legal.privacy;

  return (
    <LegalPage
      locale={locale}
      badge={legal.badgeLegal}
      title={copy.title}
      accent={copy.accent}
      updated={legal.updated}
      backLabel={legal.backHome}
      updatedLabel={legal.updatedLabel}
    >
      {copy.sections.map(([title, body]) => (
        <PolicySection key={title} title={title}>
          <p>{body}</p>
        </PolicySection>
      ))}
    </LegalPage>
  );
}
