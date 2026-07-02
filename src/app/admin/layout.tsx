import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getAdmin } from "@/lib/admin/auth";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: "Backoffice — Dralvo",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();
  if (!admin) redirect("/dashboard");

  const user = await getAuthenticatedUser();

  return (
    <AdminShell role={admin.role} permissions={admin.permissions} email={user?.email ?? admin.email ?? null}>
      {children}
    </AdminShell>
  );
}
