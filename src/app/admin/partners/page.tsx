import { redirect } from "next/navigation";

import { getAdmin } from "@/lib/admin/auth";
import { PartnersSection } from "@/components/admin/partners-section";

export default async function AdminPartnersPage() {
  const admin = await getAdmin();
  if (admin?.role !== "super_admin") redirect("/admin");
  return <PartnersSection />;
}
