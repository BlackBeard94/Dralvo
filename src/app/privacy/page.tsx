import type { Metadata } from "next";

import { LegalPage, PolicySection } from "@/components/shared/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy | Dralvo",
  description: "How Dralvo collects, uses, and protects waitlist and platform data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage badge="Legal" title="Privacy" accent="Policy">
      <PolicySection title="1. Overview">
        <p>
          Dralvo collects the minimum data needed to operate a waitlist and build
          an XAUUSD analysis platform. This includes email addresses submitted by
          users and, in later phases, account and usage data required for the app.
        </p>
      </PolicySection>

      <PolicySection title="2. Information We Collect">
        <p>
          During the MVP waitlist phase, we collect email address, signup source,
          and signup timestamp. When accounts launch, we may collect authentication
          profile data, alert preferences, dashboard settings, and subscription status.
        </p>
      </PolicySection>

      <PolicySection title="3. How We Use Data">
        <p>
          We use data to manage beta access, communicate product updates, operate
          dashboard features, secure accounts, and improve Dralvo. We do not sell
          personal information.
        </p>
      </PolicySection>

      <PolicySection title="4. Third-Party Services">
        <p>
          Dralvo may use Supabase for database/authentication, Stripe for billing,
          email providers for transactional messages, and market-data providers for
          indicator inputs. Each service receives only the data needed for its role.
        </p>
      </PolicySection>

      <PolicySection title="5. Data Rights">
        <p>
          Users may request access, correction, or deletion of personal data by
          contacting legal@dralvo.com. We may need to verify identity before acting
          on certain requests.
        </p>
      </PolicySection>

      <PolicySection title="6. Security">
        <p>
          We use reasonable technical and organizational controls for MVP data,
          including server-side storage and environment-separated service keys.
          No electronic system can be guaranteed completely secure.
        </p>
      </PolicySection>
    </LegalPage>
  );
}
