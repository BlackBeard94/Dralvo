import type { Metadata } from "next";

import { CorrelationPage } from "@/components/dashboard/dashboard-pages";
import { getDashboardPlanTier } from "@/app/dashboard/get-dashboard-plan";

export const metadata: Metadata = {
  title: "Correlation | Dralvo",
};

export default async function DashboardCorrelationRoute() {
  const planTier = await getDashboardPlanTier();
  return <CorrelationPage planTier={planTier} />;
}
