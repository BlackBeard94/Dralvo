import type { Metadata } from "next";

import { NotificationsInbox } from "@/components/dashboard/notifications-inbox";
import { getServerLocale } from "@/lib/server-locale";
import { DASHBOARD_COPY } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const c = DASHBOARD_COPY[locale].notificationsPage;
  return {
    title: c.metaTitle,
  };
}

export default function DashboardNotificationsRoute() {
  return <NotificationsInbox />;
}
