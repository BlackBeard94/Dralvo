import { NextResponse } from "next/server";

import { checkRateLimit, rateLimitKey, rateLimitResponse } from "@/lib/rate-limit";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/user/notifications/read  { id, type: "alert" | "system" }
export async function POST(request: Request) {
  const rateLimit = checkRateLimit({
    key: rateLimitKey(request, "user:notifications:read"),
    limit: 120,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.resetAt);

  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

  const body = (await request.json().catch(() => ({}))) as { id?: unknown; type?: unknown };
  const id = typeof body.id === "string" ? body.id : null;
  const type = body.type === "system" ? "system" : body.type === "alert" ? "alert" : null;
  if (!id || !type) {
    return NextResponse.json({ error: "id and type are required" }, { status: 400 });
  }

  if (type === "alert") {
    const { error } = await admin
      .from("alert_notifications")
      .update({ read: true })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await admin
      .from("system_notification_reads")
      .upsert(
        { notification_id: id, user_id: user.id },
        { onConflict: "notification_id,user_id" },
      );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
