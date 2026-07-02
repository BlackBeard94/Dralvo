import { OverviewSection } from "@/components/partner/overview-section";
import { getPartner } from "@/lib/partners/auth";

export default async function PartnerOverviewPage() {
  const partner = await getPartner();
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.dralvo.com").replace(/\/$/, "");
  const referralLink = partner ? `${site}/?p=${partner.code}` : null;
  return <OverviewSection referralLink={referralLink} />;
}
