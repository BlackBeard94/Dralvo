import type { Metadata } from "next";
import { cookies } from "next/headers";

import { LegalPage, PolicySection } from "@/components/shared/legal-page";
import { LEGAL_COPY, LOCALE_COOKIE, normalizeLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms for using Dralvo's gold decision intelligence platform.",
  alternates: { canonical: "/terms" },
};

export default async function TermsPage() {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get(LOCALE_COOKIE)?.value);
  const legal = LEGAL_COPY[locale];
  const copy = legal.terms;

  return (
    <LegalPage
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
