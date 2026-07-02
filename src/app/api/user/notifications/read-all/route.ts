import { NextResponse } from "next/server";

import { isPaidTier } from "@/lib/plan";
import { checkRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getUserPlanTierByUserId } from "@/lib/subscription-gate";
import { fetchApplicableSystemNotifications } from "@/lib/system-notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/user/notifications/read-all — marks every alert + applicable system
// notification as read for the current user.
export async function POST(request: Request) {
  const rateLimit = checkRateLimit({
    key: rateLimitKey(request, "user:notifications:read-all"),
    limit: 30,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.resetAt);

  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

  // Alerts: flip unread → read.
  await admin
    .from("alert_notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);

  // System: insert a read row for each currently-applicable notification.
  const isVip = isPaidTier(await getUserPlanTierByUserId(user.id));
  const systems = await fetchApplicableSystemNotifications(admin, user.id, isVip);
  if (systems.length > 0) {
    await admin.from("system_notification_reads").upsert(
      systems.map((s) => ({ notification_id: s.id, user_id: user.id })),
      { onConflict: "notification_id,user_id" },
    );
  }

  return NextResponse.json({ ok: true });
}
