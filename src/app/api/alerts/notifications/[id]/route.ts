import { NextResponse } from "next/server";

import { checkRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rateLimit = checkRateLimit({
    key: rateLimitKey(request, "alerts:notifications:id:patch"),
    limit: 60,
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

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const read = body.read !== false;

  const { data, error } = await supabase
    .from("alert_notifications")
    .update({ read })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Notification not found" },
      { status: error?.code === "PGRST116" ? 404 : 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
