import { redirect } from "next/navigation";

// Backoffice moved to the top-level /admin route (dedicated sidebar shell,
// no nested dashboard chrome). Keep this redirect so old links still work.
export default function LegacyAdminRedirect() {
  redirect("/admin");
}
