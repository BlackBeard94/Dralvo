import { getAdmin } from "@/lib/admin/auth";
import { SystemNotificationsManager } from "@/components/admin/system-notifications-manager";

export default async function AdminNotificationsPage() {
  const admin = await getAdmin();
  const isSuper = admin?.role === "super_admin";

  // User-facing system notifications (shown in the dashboard bell).
  return <SystemNotificationsManager canManage={isSuper} />;
}
