import type { Metadata } from "next";

import { SettingsPage } from "@/components/dashboard/dashboard-pages";
import { getDashboardPlan } from "@/app/dashboard/get-dashboard-plan";

export const metadata: Metadata = {
  title: "Settings | Dralvo",
};

export default async function DashboardSettingsRoute() {
  const { planTier, planStatus, currentPeriodEnd } = await getDashboardPlan();
  return (
    <SettingsPage
      planTier={planTier}
      planStatus={planStatus}
      currentPeriodEnd={currentPeriodEnd}
    />
  );
}
