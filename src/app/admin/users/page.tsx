import { redirect } from "next/navigation";

import { getAdmin, can } from "@/lib/admin/auth";
import { UsersSection } from "@/components/admin/users-section";

export default async function AdminUsersPage() {
  const admin = await getAdmin();
  if (!admin) redirect("/dashboard");
  if (!can(admin, "users.view")) redirect("/admin");
  return <UsersSection canEdit={can(admin, "users.edit")} />;
}
