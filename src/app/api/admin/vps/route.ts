/**
 * GET/POST /api/admin/vps
 * List VPS assignments + assign/provision VPS to user.
 * ponytail: one route with action param
 */
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getAdmin, can, batchGetEmails } from "@/lib/admin/auth";

export async function GET(request: NextRequest) {
  const admin = await getAdmin();
  if (!admin || !can(admin, "vps.manage")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = getSupabaseAdminClient();
  if (!client) return NextResponse.json({ error: "Server config" }, { status: 500 });

  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") ?? "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20"), 100);

    const { data, count } = await client
      .from("vps_assignments")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    // ponytail: batch emails — one listUsers call, not N getUserById
    const withEmails = [];
    if (data) {
      const allUserIds = [
        ...data.map((v) => v.user_id),
        ...data.map((v) => v.assigned_by).filter(Boolean),
      ] as string[];
      const emails = await batchGetEmails(client, allUserIds);
      for (const v of data) {
        withEmails.push({
          ...v,
          user_email: emails.get(v.user_id) ?? null,
          assigned_by_email: emails.get(v.assigned_by) ?? null,
        });
      }
    }

    return NextResponse.json({
      vps: withEmails,
      total: count ?? 0,
      page,
      limit,
    });
  } catch (e) {
    console.error("[Admin VPS]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await getAdmin();
  if (!admin || !can(admin, "vps.manage")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = getSupabaseAdminClient();
  if (!client) return NextResponse.json({ error: "Server config" }, { status: 500 });

  try {
    const body = await request.json();
    const { action, ...payload } = body;

    switch (action) {
      case "assign": {
        const { email, ip, username, password, notes } = payload as {
          email: string;
          ip: string;
          username?: string;
          password: string;
          notes?: string;
        };

        // Find user
        const { data: authData } = await client.auth.admin.listUsers({ page: 1, perPage: 100 });
        const targetUser = authData?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());

        if (!targetUser) {
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        await client.from("vps_assignments").insert({
          user_id: targetUser.id,
          ip,
          username: username ?? "Administrator",
          password,
          status: "active",
          notes: notes ?? "",
          assigned_by: admin.user_id,
        });

        return NextResponse.json({ success: true });
      }

      case "update_status": {
        const { vpsId, status } = payload as { vpsId: string; status: string };
        await client
          .from("vps_assignments")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("id", vpsId);
        return NextResponse.json({ success: true });
      }

      case "delete": {
        const { vpsId } = payload as { vpsId: string };
        await client.from("vps_assignments").delete().eq("id", vpsId);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (e) {
    console.error("[Admin VPS POST]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
