import { getAdmin } from "@/lib/admin/auth";
import { AffiliateSection } from "@/components/admin/affiliate-section";

export default async function AdminAffiliatePage() {
  const admin = await getAdmin();
  return <AffiliateSection isSuper={admin?.role === "super_admin"} />;
}
