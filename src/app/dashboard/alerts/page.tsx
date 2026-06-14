import type { Metadata } from "next";

import { AlertsPage } from "@/components/dashboard/dashboard-pages";
import { getDashboardPlanTier } from "@/app/dashboard/get-dashboard-plan";

export const metadata: Metadata = {
  title: "Alerts | Dralvo",
};

export default async function DashboardAlertsRoute() {
  const planTier = await getDashboardPlanTier();
  return <AlertsPage planTier={planTier} />;
}
