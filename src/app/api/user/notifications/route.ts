import { NextResponse } from "next/server";

import { isPaidTier } from "@/lib/plan";
import { checkRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getUserPlanTierByUserId } from "@/lib/subscription-gate";
import { fetchApplicableSystemNotifications } from "@/lib/system-notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AlertRow = {
  id: string;
  indicator_name: string | null;
  condition_text: string | null;
  triggered_value: string;
  triggered_at: string;
  read: boolean;
};

export async function GET(request: Request) {
  const rateLimit = checkRateLimit({
    key: rateLimitKey(request, "user:notifications:get"),
    limit: 60,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.resetAt);

  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

  const isVip = isPaidTier(await getUserPlanTierByUserId(user.id));

  const [alertsRes, systems] = await Promise.all([
    admin
      .from("alert_notifications")
      .select("id, indicator_name, condition_text, triggered_value, triggered_at, read")
      .eq("user_id", user.id)
      .order("triggered_at", { ascending: false })
      .limit(30),
    fetchApplicableSystemNotifications(admin, user.id, isVip),
  ]);

  // Resolve per-user read state for system notifications.
  const sysIds = systems.map((s) => s.id);
  let readSet = new Set<string>();
  if (sysIds.length > 0) {
    const { data: reads } = await admin
      .from("system_notification_reads")
      .select("notification_id")
      .eq("user_id", user.id)
      .in("notification_id", sysIds);
    readSet = new Set((reads ?? []).map((r) => r.notification_id as string));
  }

  const alerts = ((alertsRes.data ?? []) as AlertRow[]).map((a) => ({
    id: a.id,
    type: "alert" as const,
    title: a.indicator_name ?? "Cảnh báo",
    body: [a.condition_text, a.triggered_value].filter(Boolean).join(" · ") || null,
    href: null as string | null,
    level: "alert",
    at: a.triggered_at,
    read: a.read,
  }));

  const sys = systems.map((s) => ({
    id: s.id,
    type: "system" as const,
    title: s.title,
    body: s.body,
    href: s.href,
    level: s.level || "info",
    at: s.created_at,
    read: readSet.has(s.id),
    // Only ticker-flagged system notifications scroll in the marquee.
    showInTicker: (s as { show_in_ticker?: boolean }).show_in_ticker !== false,
    // Per-locale overrides — the client resolves to the viewer's locale.
    titleI18n: (s as { title_i18n?: Record<string, string> | null }).title_i18n ?? null,
    bodyI18n: (s as { body_i18n?: Record<string, string> | null }).body_i18n ?? null,
  }));

  const notifications = [...alerts, ...sys]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 40);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return NextResponse.json(
    { notifications, unreadCount },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
