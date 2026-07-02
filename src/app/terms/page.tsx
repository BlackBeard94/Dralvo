import type { Metadata } from "next";

import { LegalPage, PolicySection } from "@/components/shared/legal-page";
import { LEGAL_COPY } from "@/lib/i18n";
import { getServerLocale } from "@/lib/server-locale";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms for using Dralvo's gold decision intelligence platform.",
  alternates: { canonical: "/terms" },
};

export default async function TermsPage() {
  const locale = await getServerLocale();
  const legal = LEGAL_COPY[locale];
  const copy = legal.terms;

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
