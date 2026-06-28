/**
 * GET/POST /api/admin/notifications
 * ponytail: super_admin posts, all admins read. One route.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/admin/auth";

export async function GET(_request: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = getSupabaseAdminClient();
  if (!client) return NextResponse.json({ error: "Server config" }, { status: 500 });

  const { data } = await client
    .from("admin_notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({ notifications: data ?? [] });
}

export async function POST(request: NextRequest) {
  const admin = await getAdmin();
  if (!admin || admin.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized — super_admin only" }, { status: 401 });
  }

  const client = getSupabaseAdminClient();
  if (!client) return NextResponse.json({ error: "Server config" }, { status: 500 });

  try {
    const { message } = await request.json();
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    await client.from("admin_notifications").insert({
      message: message.trim(),
      created_by: admin.user_id,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[Admin Notifications]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
