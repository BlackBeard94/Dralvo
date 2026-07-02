import type { Metadata } from "next";

import { LegalPage, PolicySection } from "@/components/shared/legal-page";
import { LEGAL_COPY } from "@/lib/i18n";
import { getServerLocale } from "@/lib/server-locale";

export const metadata: Metadata = {
  title: "Financial Disclaimer",
  description:
    "Important financial disclaimer for Dralvo's gold market information.",
  alternates: { canonical: "/disclaimer" },
};

export default async function DisclaimerPage() {
  const locale = await getServerLocale();
  const legal = LEGAL_COPY[locale];
  const copy = legal.disclaimer;

  return (
    <LegalPage
      locale={locale}
      badge={legal.badgeImportant}
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
