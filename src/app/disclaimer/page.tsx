import type { Metadata } from "next";

import { LegalPage, PolicySection } from "@/components/shared/legal-page";

export const metadata: Metadata = {
  title: "Financial Disclaimer | Dralvo",
  description: "Important financial disclaimer for Dralvo's XAUUSD analysis platform.",
};

export default function DisclaimerPage() {
  return (
    <LegalPage badge="Important" title="Financial" accent="Disclaimer">
      <PolicySection title="Informational Purposes Only">
        <p>
          Dralvo is for informational purposes only, not financial advice. Nothing
          on Dralvo should be interpreted as a recommendation to buy, sell, hold,
          or trade gold, XAUUSD, CFDs, futures, ETFs, crypto, or any other instrument.
        </p>
      </PolicySection>

      <PolicySection title="No Investment Advisory Relationship">
        <p>
          Dralvo is not a broker, dealer, investment adviser, commodity trading
          adviser, or financial planner. Use of Dralvo does not create an advisory
          relationship.
        </p>
      </PolicySection>

      <PolicySection title="Trading Risk">
        <p>
          Trading XAUUSD, CFDs, futures, leveraged products, and other financial
          instruments involves substantial risk and may result in losses exceeding
          initial capital. Past performance and historical indicator behavior do
          not guarantee future results.
        </p>
      </PolicySection>

      <PolicySection title="Data Limitations">
        <p>
          Market data and derived indicators may be delayed, inaccurate, incomplete,
          or unavailable. Users must independently verify information before making
          decisions.
        </p>
      </PolicySection>
    </LegalPage>
  );
}
