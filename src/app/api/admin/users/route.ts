/**
 * GET/POST /api/admin/users
 * List/search users + manage licenses (revoke, extend, edit).
 * ponytail: one route, GET=list/search, POST=mutations via action param
 */
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getAdmin, can } from "@/lib/admin/auth";
import { reconcilePreboundLock } from "@/lib/license-binding";
import { channelOf, type AttrRow } from "@/lib/marketing/funnel";

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

    // ── Acquisition source (who referred) + traffic source (platform) ──
    // source  = profiles.referrer_type/referrer_id → affiliate code / partner name.
    // traffic = marketing_attribution channel (utm_source / click-id) + medium.
    const sourceByUser = new Map<string, { type: "affiliate" | "partner" | "direct"; label: string }>();
    const trafficByUser = new Map<string, { channel: string; medium: string | null }>();
    if (userIds.length > 0) {
      const [{ data: profs }, { data: attr }] = await Promise.all([
        client.from("profiles").select("id, referrer_type, referrer_id").in("id", userIds),
        client
          .from("marketing_attribution")
          .select("user_id, utm_source, utm_medium, utm_campaign, gclid, fbclid, ttclid, first_seen_at")
          .in("user_id", userIds),
      ]);

      const affIds = [...new Set((profs ?? []).filter((p) => p.referrer_type === "affiliate" && p.referrer_id).map((p) => p.referrer_id as string))];
      const partnerIds = [...new Set((profs ?? []).filter((p) => p.referrer_type === "partner" && p.referrer_id).map((p) => p.referrer_id as string))];
      const affMap = new Map<string, string>();
      const partnerMap = new Map<string, string>();
      await Promise.all([
        affIds.length
          ? client.from("affiliates").select("id, code").in("id", affIds).then(({ data }) => (data ?? []).forEach((a) => affMap.set(a.id as string, a.code as string)))
          : Promise.resolve(),
        partnerIds.length
          ? client.from("partners").select("id, code, name").in("id", partnerIds).then(({ data }) => (data ?? []).forEach((p) => partnerMap.set(p.id as string, (p.name as string) || (p.code as string))))
          : Promise.resolve(),
      ]);

      for (const p of profs ?? []) {
        if (p.referrer_type === "affiliate" && p.referrer_id) {
          sourceByUser.set(p.id as string, { type: "affiliate", label: `Affiliate · ${affMap.get(p.referrer_id as string) ?? "?"}` });
        } else if (p.referrer_type === "partner" && p.referrer_id) {
          sourceByUser.set(p.id as string, { type: "partner", label: `Partner · ${partnerMap.get(p.referrer_id as string) ?? "?"}` });
        }
      }
      for (const row of (attr ?? []) as AttrRow[]) {
        trafficByUser.set(row.user_id, { channel: channelOf(row), medium: (row as AttrRow & { utm_medium?: string | null }).utm_medium ?? null });
      }
    }

    // Map — a user may now hold one license key per EA, so return them all.
    // (Per-key device binding / unbind lives in the License module:
    //  /api/admin/licenses + LicensesTab.)
    const result = users.map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      licenses: (licenses ?? []).filter((l) => l.user_id === u.id),
      subscription: (subscriptions ?? []).find((s) => s.user_id === u.id) ?? null,
      source: sourceByUser.get(u.id) ?? { type: "direct" as const, label: "Trực tiếp" },
      trafficSource: trafficByUser.get(u.id) ?? null,
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

    const PRODUCTS = ["goldmaster", "goldscalp", "tigold", "goldwave"] as const;
    const isProduct = (p: unknown): p is (typeof PRODUCTS)[number] =>
      typeof p === "string" && (PRODUCTS as readonly string[]).includes(p);

    switch (action) {
      case "revoke_license": {
        // Revoke a single per-EA key (product required). Without it, fall back
        // to clearing all of the user's keys (legacy behaviour).
        const { userId, product } = payload as { userId: string; product?: string };
        let q = client.from("license_keys").delete().eq("user_id", userId);
        if (isProduct(product)) q = q.eq("product", product);
        await q;
        return NextResponse.json({ success: true });
      }
      case "extend_license": {
        const { userId, product, expiresAt } = payload as {
          userId: string;
          product?: string;
          expiresAt: string;
        };
        if (!isProduct(product)) {
          return NextResponse.json({ error: "Invalid product" }, { status: 400 });
        }
        // upsert — creates the per-EA row if it doesn't exist yet.
        await client
          .from("license_keys")
          .upsert(
            { user_id: userId, product, plan: "unlimited", expires_at: expiresAt, managed_by: admin.user_id },
            { onConflict: "user_id,product" },
          );
        return NextResponse.json({ success: true });
      }
      case "add_key": {
        // Issue a new per-EA key for a user.
        const { userId, product, plan, maxAccounts, expiresAt } = payload as {
          userId: string;
          product?: string;
          plan?: string;
          maxAccounts?: number;
          expiresAt?: string | null;
        };
        if (!isProduct(product)) {
          return NextResponse.json({ error: "Invalid product" }, { status: 400 });
        }
        const expiry = expiresAt || null; // "" → null (forever)
        const row: Record<string, unknown> = {
          user_id: userId,
          product,
          plan: plan === "tigold" ? "tigold" : "unlimited",
          managed_by: admin.user_id,
          expires_at: expiry,
          // No expiry = an explicit lifetime comp, so validate's expiry gate passes.
          is_lifetime: expiry === null,
        };
        if (typeof maxAccounts === "number" && maxAccounts >= 1) {
          row.max_accounts = maxAccounts;
        }
        await client.from("license_keys").upsert(row, { onConflict: "user_id,product" });
        return NextResponse.json({ success: true });
      }
      case "set_max_accounts": {
        // Admin tunes how many MT5 accounts a given key may bind.
        const { userId, product, maxAccounts } = payload as {
          userId: string;
          product?: string;
          maxAccounts?: number;
        };
        if (!isProduct(product)) {
          return NextResponse.json({ error: "Invalid product" }, { status: 400 });
        }
        if (typeof maxAccounts !== "number" || maxAccounts < 1) {
          return NextResponse.json({ error: "Invalid maxAccounts" }, { status: 400 });
        }
        const { data: updated } = await client
          .from("license_keys")
          .update({ max_accounts: maxAccounts })
          .eq("user_id", userId)
          .eq("product", product)
          .select("id");
        if (!updated || updated.length === 0) {
          return NextResponse.json({ error: "Không tìm thấy key cho user/product này" }, { status: 404 });
        }
        // Raising the cap above 1 unlocks an IB-pinned key — migrate its
        // mt5_account into license_devices so max_accounts takes effect.
        await reconcilePreboundLock(client, updated[0].id);
        return NextResponse.json({ success: true });
      }
      case "create_user": {
        // Create a new auth user (email confirmed so they can sign in / reset).
        const { email, password } = payload as { email?: string; password?: string };
        const mail = email?.trim().toLowerCase();
        if (!mail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) {
          return NextResponse.json({ error: "Email không hợp lệ" }, { status: 400 });
        }
        if (!password || password.length < 6) {
          return NextResponse.json({ error: "Mật khẩu tối thiểu 6 ký tự" }, { status: 400 });
        }
        const { data, error } = await client.auth.admin.createUser({
          email: mail,
          password,
          email_confirm: true,
        });
        if (error) {
          const dup = /already.*registered|exists/i.test(error.message);
          return NextResponse.json({ error: dup ? "Email này đã tồn tại" : error.message }, { status: dup ? 409 : 500 });
        }
        return NextResponse.json({ success: true, userId: data.user?.id });
      }
      case "delete_user": {
        const { userId } = payload as { userId?: string };
        if (!userId) return NextResponse.json({ error: "Thiếu userId" }, { status: 400 });
        if (userId === admin.user_id) {
          return NextResponse.json({ error: "Không thể xóa chính bạn" }, { status: 403 });
        }
        // Don't let a regular delete nuke another admin account.
        const { data: targetAdmin } = await client
          .from("admin_users")
          .select("id")
          .eq("user_id", userId)
          .limit(1);
        if (targetAdmin && targetAdmin.length > 0) {
          return NextResponse.json({ error: "Tài khoản này là quản trị viên — gỡ quyền admin trước khi xóa." }, { status: 403 });
        }
        // FK on delete cascade clears profiles / license_keys / devices / subs.
        const { error } = await client.auth.admin.deleteUser(userId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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
