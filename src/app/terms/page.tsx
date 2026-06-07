import type { Metadata } from "next";

import { LegalPage, PolicySection } from "@/components/shared/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service | Dralvo",
  description: "Terms for using Dralvo's XAUUSD analysis platform.",
};

export default function TermsPage() {
  return (
    <LegalPage badge="Legal" title="Terms of" accent="Service">
      <PolicySection title="1. Acceptance">
        <p>
          By using Dralvo, you agree to these terms. If you do not agree, do not
          use the website, waitlist, dashboard, or related services.
        </p>
      </PolicySection>

      <PolicySection title="2. Product Scope">
        <p>
          Dralvo provides informational XAUUSD dashboards, indicator context, and
          analysis tooling. It does not execute trades, manage funds, or act as a
          broker, investment adviser, or financial planner.
        </p>
      </PolicySection>

      <PolicySection title="3. User Responsibility">
        <p>
          You are responsible for your own trading decisions, risk management,
          account security, and compliance with laws that apply to you.
        </p>
      </PolicySection>

      <PolicySection title="4. Accounts and Access">
        <p>
          Beta access may be limited, revoked, or modified while the product is
          under active development. Paid plans will be governed by the billing
          terms presented at checkout when Stripe payments are enabled.
        </p>
      </PolicySection>

      <PolicySection title="5. Availability">
        <p>
          Market data, indicators, and dashboards may be delayed, incomplete, or
          unavailable. Dralvo is provided as-is during MVP development.
        </p>
      </PolicySection>
    </LegalPage>
  );
}
