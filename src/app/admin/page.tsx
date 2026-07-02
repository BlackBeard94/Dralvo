import { redirect } from "next/navigation";

import { getAdmin } from "@/lib/admin/auth";
import { OverviewSection } from "@/components/admin/overview-section";

export default async function AdminOverviewPage() {
  const admin = await getAdmin();
  if (!admin) redirect("/dashboard");

  // Overview shows user + revenue stats → only for super_admin or admins with
  // at least users.view or finance.view. Others land on a section they can use.
  const canOverview = admin.role === "super_admin" || !!admin.permissions.users?.view || !!admin.permissions.finance?.view;
  if (!canOverview) {
    if (admin.permissions.affiliate?.manage) redirect("/admin/affiliate");
    redirect("/admin/notifications");
  }

  return <OverviewSection />;
}
