import type { Metadata } from "next";

import { ChartPage } from "@/components/dashboard/dashboard-pages";

export const metadata: Metadata = {
  title: "XAUUSD Chart | Dralvo",
};

export default function DashboardChartRoute() {
  return <ChartPage />;
}
