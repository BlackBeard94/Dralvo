import { redirect } from "next/navigation";

// V1 market-analysis surface — not part of the V2 EA product and not in nav.
export default function DashboardDriversRoute() {
  redirect("/dashboard");
}
