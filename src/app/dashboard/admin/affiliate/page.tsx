import { redirect } from "next/navigation";

export default function LegacyAdminAffiliateRedirect() {
  redirect("/admin/affiliate");
}
