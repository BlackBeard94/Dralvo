import { redirect } from "next/navigation";

// V1 market-analysis surface — not part of the V2 EA product and not in nav.
// Redirect so old links/bookmarks don't land on an unlinked page.
export default function DashboardChartRoute() {
  redirect("/dashboard");
}
