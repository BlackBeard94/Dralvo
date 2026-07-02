import { redirect } from "next/navigation";

import { getAdmin, can } from "@/lib/admin/auth";
import { LicensesTab } from "@/components/admin/licenses-tab";

export default async function AdminLicensesPage() {
  const admin = await getAdmin();
  if (!admin) redirect("/dashboard");
  if (!can(admin, "license.manage")) redirect("/admin");
  return <LicensesTab />;
}
