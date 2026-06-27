import type { Metadata } from "next";

import { getDashboardPlanTier } from "@/app/dashboard/get-dashboard-plan";
import { ThesisReplay } from "@/components/dashboard/thesis-replay";
import { isPaidTier } from "@/lib/plan";

export const metadata: Metadata = {
  title: "Historical Replay | Dralvo",
};

export default async function DashboardReplayRoute() {
  const planTier = await getDashboardPlanTier();
  return <ThesisReplay isPro={isPaidTier(planTier)} />;
}
