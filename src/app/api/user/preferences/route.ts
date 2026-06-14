import { NextResponse } from "next/server";

import { checkRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

type NotificationPrefs = {
  email?: boolean;
  telegram?: boolean;
  in_app?: boolean;
};

function normalizePrefs(value: unknown): NotificationPrefs | null {
  if (!value || typeof value !== "object") return null;

  const input = value as Record<string, unknown>;
  return {
    email: input.email === true,
    telegram: input.telegram === true,
    in_app: input.in_app !== false,
  };
}

export async function PATCH(request: Request) {
  const rateLimit = checkRateLimit({
    key: rateLimitKey(request, "user:preferences:patch"),
    limit: 30,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetAt);
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const prefs = normalizePrefs(body.notification_prefs);

  if (!prefs) {
    return NextResponse.json(
      { error: "notification_prefs is required" },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("profiles")
    .update({ notification_prefs: prefs })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, notification_prefs: prefs });
}
