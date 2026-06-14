import { NextResponse } from "next/server";

import { buildAlertEmail, sendEmail } from "@/lib/notifications/email";
import { buildAlertTelegramMessage, sendTelegramMessage } from "@/lib/notifications/telegram";
import { checkRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";
import { getUserPlanTierByUserId } from "@/lib/subscription-gate";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

type NotificationPrefs = {
  email?: boolean;
  telegram?: boolean;
  in_app?: boolean;
};

export async function POST(request: Request) {
  const rateLimit = checkRateLimit({
    key: rateLimitKey(request, "alerts:test-notification"),
    limit: 5,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetAt);
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tier = await getUserPlanTierByUserId(user.id);
  if (tier !== "Pro") {
    return NextResponse.json(
      { error: "Test notifications require Dralvo Pro." },
      { status: 403 },
    );
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("email,telegram_chat_id,notification_prefs")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return NextResponse.json(
      { error: error?.message ?? "Profile not found" },
      { status: 500 },
    );
  }

  const prefs = (profile.notification_prefs ?? {}) as NotificationPrefs;
  const result = {
    email: false,
    telegram: false,
    in_app: false,
  };

  const indicatorName = "Dralvo Test Alert";
  const conditionText = "test notification";
  const triggeredValue = "OK";

  if (prefs.email !== false && profile.email) {
    const payload = buildAlertEmail({
      indicatorName,
      conditionText,
      triggeredValue,
      alertId: "test-notification",
    });
    payload.to = profile.email;
    result.email = await sendEmail(payload);
  }

  if (prefs.telegram === true && profile.telegram_chat_id) {
    result.telegram = await sendTelegramMessage(
      profile.telegram_chat_id,
      buildAlertTelegramMessage({
        indicatorName,
        conditionText,
        triggeredValue,
      }),
    );
  }

  return NextResponse.json({ ok: true, dispatched: result });
}
