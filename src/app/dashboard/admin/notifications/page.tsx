import { redirect } from "next/navigation";

export default function LegacyAdminNotificationsRedirect() {
  redirect("/admin/notifications");
}
