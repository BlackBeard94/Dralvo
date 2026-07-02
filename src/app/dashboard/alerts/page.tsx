import { redirect } from "next/navigation";

// v1 "Alert Rules" (thesis monitors) page removed. Keep this redirect so old
// links / bookmarks don't 404 — notifications now live in the bell + inbox.
export default function DashboardAlertsRoute() {
  redirect("/dashboard");
}
