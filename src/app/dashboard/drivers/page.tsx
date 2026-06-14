import type { Metadata } from "next";

import { DriversPage } from "@/components/dashboard/dashboard-pages";

export const metadata: Metadata = {
  title: "Drivers | Dralvo",
};

export default function DashboardDriversRoute() {
  return <DriversPage />;
}
