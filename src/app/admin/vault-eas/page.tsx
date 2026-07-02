import { redirect } from "next/navigation";

import { getAdmin } from "@/lib/admin/auth";
import { VaultEasSection } from "@/components/admin/vault-eas-section";

export default async function AdminVaultEasPage() {
  const admin = await getAdmin();
  if (admin?.role !== "super_admin") redirect("/admin");
  return <VaultEasSection />;
}
