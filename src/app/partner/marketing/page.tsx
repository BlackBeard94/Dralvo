import { redirect } from "next/navigation";

import { getPartner } from "@/lib/partners/auth";
import { PartnerMarketingSection } from "@/components/partner/partner-marketing-section";

export default async function PartnerMarketingPage() {
  const partner = await getPartner();
  if (!partner) redirect("/dashboard");
  return <PartnerMarketingSection code={partner.code} />;
}
