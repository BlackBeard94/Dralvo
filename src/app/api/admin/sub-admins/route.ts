/**
 * GET/POST /api/admin/sub-admins
 * Super admin: list/create/update/delete sub-admin accounts.
 * ponytail: one route with action param, same pattern as affiliate payout
 */
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getAdmin, listSubAdmins } from "@/lib/admin/auth";
import type { AdminPermissions } from "@/lib/admin/types";
import { DEFAULT_ADMIN_PERMISSIONS, DEFAULT_SUPPORT_PERMISSIONS } from "@/lib/admin/types";

export async function GET(_request: NextRequest) {
  const admin = await getAdmin();
  if (!admin || admin.role !== "super_admin") {
    return NextResponse.json({ error: "Chỉ super admin mới quản lý được quản trị viên." }, { status: 403 });
  }
  const subAdmins = await listSubAdmins();
  return NextResponse.json({ subAdmins });
}

export async function POST(request: NextRequest) {
  const admin = await getAdmin();
  if (!admin || admin.role !== "super_admin") {
    return NextResponse.json({ error: "Chỉ super admin mới quản lý được quản trị viên." }, { status: 403 });
  }

  const client = getSupabaseAdminClient();
  if (!client) return NextResponse.json({ error: "Server config" }, { status: 500 });

  try {
    const body = await request.json();
    const { action, ...payload } = body;

    switch (action) {
      case "create": {
        const { email, role, permissions } = payload as {
          email: string;
          role: string;
          permissions: AdminPermissions;
        };

        // Find user by email in auth.users
        // ponytail: Supabase admin API doesn't support lookup-by-email directly.
        // We search the first page; for production, iterate pages.
        const allUsers = await client.auth.admin.listUsers({ page: 1, perPage: 100 });
        const targetUser = allUsers.data?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());

        if (!targetUser) {
          return NextResponse.json({ error: "User not found. They must sign up first." }, { status: 404 });
        }

        // Check not already admin
        const { data: already } = await client
          .from("admin_users")
          .select("id")
          .eq("user_id", targetUser.id)
          .limit(1);

        if (already && already.length > 0) {
          return NextResponse.json({ error: "User is already an admin." }, { status: 409 });
        }

        const defaults = role === "support" ? DEFAULT_SUPPORT_PERMISSIONS : DEFAULT_ADMIN_PERMISSIONS;

        await client.from("admin_users").insert({
          user_id: targetUser.id,
          role,
          permissions: permissions ?? defaults,
          created_by: admin.user_id,
        });

        const subAdmins = await listSubAdmins();
        return NextResponse.json({ success: true, subAdmins });
      }

      case "update": {
        const { subAdminId, role, permissions } = payload as {
          subAdminId: string;
          role?: string;
          permissions?: AdminPermissions;
        };

        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (role) updates.role = role;
        if (permissions) updates.permissions = permissions;

        await client.from("admin_users").update(updates).eq("id", subAdminId);

        const subAdmins = await listSubAdmins();
        return NextResponse.json({ success: true, subAdmins });
      }

      case "delete": {
        const { subAdminId } = payload as { subAdminId: string };
        // ponytail: only prevent deleting yourself
        const { data: target } = await client
          .from("admin_users")
          .select("user_id, role")
          .eq("id", subAdminId)
          .single();

        if (target?.user_id === admin.user_id) {
          return NextResponse.json({ error: "Cannot delete yourself" }, { status: 403 });
        }

        await client.from("admin_users").delete().eq("id", subAdminId);

        const subAdmins = await listSubAdmins();
        return NextResponse.json({ success: true, subAdmins });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (e) {
    console.error("[Admin Sub-Admins]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
