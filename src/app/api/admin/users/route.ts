/**
 * GET/POST /api/admin/users
 * List/search users + manage licenses (revoke, extend, edit).
 * ponytail: one route, GET=list/search, POST=mutations via action param
 */
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getAdmin, can } from "@/lib/admin/auth";

export async function GET(request: NextRequest) {
  const admin = await getAdmin();
  if (!admin || !can(admin, "users.view")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = getSupabaseAdminClient();
  if (!client) return NextResponse.json({ error: "Server config" }, { status: 500 });

  try {
    const url = new URL(request.url);
    const search = url.searchParams.get("q") ?? "";
    const page = parseInt(url.searchParams.get("page") ?? "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20"), 100);
    const offset = (page - 1) * limit;

    // Get all auth users with search
    let users: { id: string; email: string; created_at: string }[] = [];
    if (search) {
      const { data } = await client.auth.admin.listUsers({ page: 1, perPage: 50 });
      users = (data?.users ?? [])
        .filter((u) => u.email?.toLowerCase().includes(search.toLowerCase()))
        .map((u) => ({ id: u.id, email: u.email ?? "", created_at: u.created_at }));
    } else {
      const { data } = await client.auth.admin.listUsers({ page, perPage: limit });
      users = (data?.users ?? []).map((u) => ({
        id: u.id,
        email: u.email ?? "",
        created_at: u.created_at,
      }));
    }

    // Batch fetch license_keys for these users
    const userIds = users.map((u) => u.id);
    let licenseQuery = client.from("license_keys").select("*");
    if (userIds.length > 0) {
      licenseQuery = licenseQuery.in("user_id", userIds);
    }
    // ponytail: branch — sub-admins only see licenses they manage
    if (admin.role !== "super_admin") {
      licenseQuery = licenseQuery.eq("managed_by", admin.user_id);
    }
    const { data: licenses } = userIds.length > 0 ? await licenseQuery : { data: [] };

    // Batch fetch subscriptions
    const { data: subscriptions } = userIds.length > 0
      ? await client.from("subscriptions").select("*").in("user_id", userIds)
      : { data: [] };

    // Map
    const result = users.map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      license: (licenses ?? []).find((l) => l.user_id === u.id) ?? null,
      subscription: (subscriptions ?? []).find((s) => s.user_id === u.id) ?? null,
    }));

    return NextResponse.json({ users: result });
  } catch (e) {
    console.error("[Admin Users]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await getAdmin();
  if (!admin || !can(admin, "users.edit")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = getSupabaseAdminClient();
  if (!client) return NextResponse.json({ error: "Server config" }, { status: 500 });

  try {
    const body = await request.json();
    const { action, ...payload } = body;

    switch (action) {
      case "revoke_license": {
        const { userId } = payload as { userId: string };
        await client.from("license_keys").delete().eq("user_id", userId);
        return NextResponse.json({ success: true });
      }
      case "extend_license": {
        const { userId, expiresAt } = payload as { userId: string; expiresAt: string };
        // ponytail: upsert — creates row if user has no license yet
        // ponytail: branch — stamp who manages this license
        await client
          .from("license_keys")
          .upsert({ user_id: userId, plan: "unlimited", expires_at: expiresAt, managed_by: admin.user_id }, { onConflict: "user_id" });
        return NextResponse.json({ success: true });
      }
      case "set_license_plan": {
        const { userId, plan } = payload as { userId: string; plan: string };
        await client
          .from("license_keys")
          .upsert({ user_id: userId, plan, managed_by: admin.user_id }, { onConflict: "user_id" });
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (e) {
    console.error("[Admin Users POST]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
