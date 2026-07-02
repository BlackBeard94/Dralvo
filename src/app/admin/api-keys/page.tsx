import { redirect } from "next/navigation";

import { getAdmin } from "@/lib/admin/auth";
import { AgentKeysManager } from "@/components/admin/agent-keys-manager";

export default async function AdminApiKeysPage() {
  const admin = await getAdmin();
  // Agent keys can read customer data and grant licenses → super_admin only.
  if (!admin || admin.role !== "super_admin") redirect("/admin");
  return <AgentKeysManager />;
}
