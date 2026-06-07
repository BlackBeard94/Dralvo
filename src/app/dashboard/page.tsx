import type { Metadata } from "next";
import { DashboardPageClient } from "./dashboard-page-client";

export const metadata: Metadata = {
  title: "Dralvo | XAUUSD Command Center",
  description:
    "Production-grade XAUUSD dashboard with live charts, indicator surface, correlation matrix, and real-time market data.",
};

export default function DashboardPage() {
  return <DashboardPageClient />;
}
