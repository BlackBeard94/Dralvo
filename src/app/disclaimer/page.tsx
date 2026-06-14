import type { Metadata } from "next";
import { cookies } from "next/headers";

import { LegalPage, PolicySection } from "@/components/shared/legal-page";
import { LEGAL_COPY, LOCALE_COOKIE, normalizeLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Financial Disclaimer",
  description: "Important financial disclaimer for Dralvo's gold market information.",
  alternates: { canonical: "/disclaimer" },
};

export default async function DisclaimerPage() {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get(LOCALE_COOKIE)?.value);
  const legal = LEGAL_COPY[locale];
  const copy = legal.disclaimer;

  return (
    <LegalPage
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
