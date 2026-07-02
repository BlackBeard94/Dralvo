import { redirect } from "next/navigation";

import { getAdmin } from "@/lib/admin/auth";
import { AdminsSection } from "@/components/admin/admins-section";

export default async function AdminAdminsPage() {
  const admin = await getAdmin();
  if (admin?.role !== "super_admin") redirect("/admin");
  return <AdminsSection />;
}
