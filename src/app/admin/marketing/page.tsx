import { redirect } from "next/navigation";

import { getAdmin } from "@/lib/admin/auth";
import { MarketingSection } from "@/components/admin/marketing-section";

export default async function AdminMarketingPage() {
  const admin = await getAdmin();
  if (!admin) redirect("/dashboard");
  if (admin.role !== "super_admin" && !admin.permissions.marketing?.view) {
    redirect("/admin");
  }
  return <MarketingSection />;
}
