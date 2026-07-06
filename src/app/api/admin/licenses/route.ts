/**
 * GET/POST /api/admin/licenses
 * License-centric management: list/search every license_key, create / edit /
 * delete keys, tune max_accounts and all editable fields, inspect & unbind
 * activated MT5 devices.
 *
 * Auth: reuses the `users` permission scope (licenses belong to users) —
 *   GET     → users.view
 *   POST    → users.edit
 * Sub-admins only see / mutate keys where managed_by = their own user_id.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getAdmin, can, batchGetEmails } from "@/lib/admin/auth";
import { reconcilePreboundLock } from "@/lib/license-binding";

const PRODUCTS = ["goldmaster", "goldscalp", "tigold", "goldwave"] as const;
const PLANS = ["tigold", "unlimited"] as const;
type Product = (typeof PRODUCTS)[number];
type Plan = (typeof PLANS)[number];

// Anti-share defaults per EA. A VIP bundle uses these unless overridden.
const DEFAULT_MAX: Record<Product, number> = { goldmaster: 2, goldscalp: 2, tigold: 1, goldwave: 1 };

const isProduct = (p: unknown): p is Product =>
  typeof p === "string" && (PRODUCTS as readonly string[]).includes(p);
const isPlan = (p: unknown): p is Plan =>
  typeof p === "string" && (PLANS as readonly string[]).includes(p);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type AuthUser = { id: string; email: string | null };

/**
 * ponytail: one listUsers call, filter in memory. Fine for an early-stage user
 * base; revisit with a server-side filter if the user count outgrows one page.
 */
async function findUsersByEmail(
  client: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  q: string,
  exact: boolean,
): Promise<AuthUser[]> {
  const { data } = await client.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const users = data?.users ?? [];
  const ql = q.toLowerCase();
  return users
    .filter((u) =>
      u.email ? (exact ? u.email.toLowerCase() === ql : u.email.toLowerCase().includes(ql)) : false,
    )
    .map((u) => ({ id: u.id, email: u.email ?? null }));
}

export async function GET(request: NextRequest) {
  const admin = await getAdmin();
  if (!admin || !can(admin, "license.manage")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = getSupabaseAdminClient();
  if (!client) return NextResponse.json({ error: "Server config" }, { status: 500 });

  try {
    const url = new URL(request.url);
    const rawQ = (url.searchParams.get("q") ?? "").trim();
    const page = Math.max(parseInt(url.searchParams.get("page") ?? "1"), 1);
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "25"), 100);
    const offset = (page - 1) * limit;

    let query = client
      .from("license_keys")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    // Sub-admins only see keys they manage.
    if (admin.role !== "super_admin") {
      query = query.eq("managed_by", admin.user_id);
    }

    if (rawQ) {
      // Strip characters that would break the PostgREST or() filter grammar.
      const q = rawQ.replace(/[,()*%]/g, "");
      const orParts = [`product.ilike.*${q}*`, `mt5_account.ilike.*${q}*`];
      if (UUID_RE.test(rawQ)) orParts.push(`key.eq.${rawQ}`);
      // Resolve email substring → user ids so search-by-email works too.
      const matched = await findUsersByEmail(client, q, false);
      if (matched.length > 0) orParts.push(`user_id.in.(${matched.map((u) => u.id).join(",")})`);
      query = query.or(orParts.join(","));
    }

    const { data: licenses, count, error } = await query.range(offset, offset + limit - 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rows = licenses ?? [];

    // Emails for the owners on this page (one listUsers call).
    const emails = await batchGetEmails(client, rows.map((l) => l.user_id));

    // Bound devices for the keys on this page (one query).
    const ids = rows.map((l) => l.id);
    const { data: devices } = ids.length
      ? await client
          .from("license_devices")
          .select("id, license_id, mt5_account, first_seen, last_seen")
          .in("license_id", ids)
      : { data: [] };

    const result = rows.map((l) => {
      const devs = (devices ?? []).filter((d) => d.license_id === l.id);
      return {
        id: l.id,
        user_id: l.user_id,
        email: emails.get(l.user_id) ?? null,
        plan: l.plan,
        product: l.product,
        key: l.key,
        mt5_account: l.mt5_account,
        expires_at: l.expires_at,
        is_lifetime: l.is_lifetime,
        max_accounts: l.max_accounts,
        managed_by: l.managed_by,
        created_at: l.created_at,
        devices: devs,
        device_count: devs.length,
      };
    });

    return NextResponse.json({ licenses: result, total: count ?? 0, page, limit });
  } catch (e) {
    console.error("[Admin Licenses GET]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await getAdmin();
  if (!admin || !can(admin, "license.manage")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = getSupabaseAdminClient();
  if (!client) return NextResponse.json({ error: "Server config" }, { status: 500 });

  const isSuper = admin.role === "super_admin";

  try {
    const body = await request.json();
    const { action } = body as { action?: string };

    switch (action) {
      /* ---- create a brand-new key ---- */
      case "create": {
        const { email, product, plan, maxAccounts, expiresAt, isLifetime, mt5Account, allProducts } =
          body as {
            email?: string;
            product?: string;
            plan?: string;
            maxAccounts?: number;
            expiresAt?: string | null;
            isLifetime?: boolean;
            mt5Account?: string | null;
            allProducts?: boolean;
          };
        if (!email) return NextResponse.json({ error: "Thiếu email user" }, { status: 400 });
        if (!isPlan(plan)) return NextResponse.json({ error: "Gói không hợp lệ" }, { status: 400 });

        const [user] = await findUsersByEmail(client, email.trim(), true);
        if (!user) return NextResponse.json({ error: "Không tìm thấy user với email này" }, { status: 404 });

        const expiry = expiresAt ? expiresAt : null;
        const lifetime = typeof isLifetime === "boolean" ? isLifetime : expiry === null;

        /* VIP bundle: create/refresh all 3 EA keys at once. Upsert on
         * (user_id, product) so re-running tops up missing EAs and keeps the
         * existing key value for EAs the user already has. */
        if (allProducts) {
          const rows = PRODUCTS.map((p) => ({
            user_id: user.id,
            product: p,
            plan,
            managed_by: admin.user_id,
            expires_at: expiry,
            is_lifetime: lifetime,
            mt5_account: null,
            max_accounts: typeof maxAccounts === "number" && maxAccounts >= 1 ? maxAccounts : DEFAULT_MAX[p],
          }));
          const { error } = await client
            .from("license_keys")
            .upsert(rows, { onConflict: "user_id,product" });
          if (error) return NextResponse.json({ error: error.message }, { status: 500 });
          return NextResponse.json({ success: true, count: rows.length, products: [...PRODUCTS] });
        }

        /* Single EA. */
        if (!isProduct(product)) return NextResponse.json({ error: "Sản phẩm không hợp lệ" }, { status: 400 });
        const row: Record<string, unknown> = {
          user_id: user.id,
          product,
          plan,
          managed_by: admin.user_id,
          expires_at: expiry,
          is_lifetime: lifetime,
          mt5_account: mt5Account ? mt5Account.trim() : null,
        };
        if (typeof maxAccounts === "number" && maxAccounts >= 1) row.max_accounts = maxAccounts;

        const { data, error } = await client.from("license_keys").insert(row).select("id, key").single();
        if (error) {
          if (error.code === "23505") {
            return NextResponse.json(
              { error: "User đã có key cho sản phẩm này (hoặc MT5 account đã được dùng)" },
              { status: 409 },
            );
          }
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        // Single create with both mt5_account + max_accounts>1 is contradictory;
        // keep max_accounts authoritative by unlocking the pin.
        if (data?.id) await reconcilePreboundLock(client, data.id);
        return NextResponse.json({ success: true, id: data?.id, key: data?.key });
      }

      /* ---- edit an existing key ---- */
      case "update": {
        const { id, product, plan, maxAccounts, expiresAt, isLifetime, mt5Account, regenerateKey } =
          body as {
            id?: string;
            product?: string;
            plan?: string;
            maxAccounts?: number;
            expiresAt?: string | null;
            isLifetime?: boolean;
            mt5Account?: string | null;
            regenerateKey?: boolean;
          };
        if (!id) return NextResponse.json({ error: "Thiếu license id" }, { status: 400 });

        const updates: Record<string, unknown> = {};
        if (product !== undefined) {
          if (!isProduct(product)) return NextResponse.json({ error: "Sản phẩm không hợp lệ" }, { status: 400 });
          updates.product = product;
        }
        if (plan !== undefined) {
          if (!isPlan(plan)) return NextResponse.json({ error: "Gói không hợp lệ" }, { status: 400 });
          updates.plan = plan;
        }
        if (maxAccounts !== undefined) {
          if (typeof maxAccounts !== "number" || maxAccounts < 1) {
            return NextResponse.json({ error: "max_accounts phải >= 1" }, { status: 400 });
          }
          updates.max_accounts = maxAccounts;
        }
        if (expiresAt !== undefined) updates.expires_at = expiresAt ? expiresAt : null;
        if (isLifetime !== undefined) updates.is_lifetime = !!isLifetime;
        if (mt5Account !== undefined) updates.mt5_account = mt5Account ? mt5Account.trim() : null;
        if (regenerateKey) updates.key = crypto.randomUUID();

        if (Object.keys(updates).length === 0) {
          return NextResponse.json({ error: "Không có thay đổi nào" }, { status: 400 });
        }

        let q = client.from("license_keys").update(updates).eq("id", id);
        if (!isSuper) q = q.eq("managed_by", admin.user_id);
        const { data, error } = await q.select("id");
        if (error) {
          if (error.code === "23505") {
            return NextResponse.json(
              { error: "Trùng (user, product) hoặc MT5 account đã được dùng" },
              { status: 409 },
            );
          }
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        if (!data || data.length === 0) {
          return NextResponse.json({ error: "Không tìm thấy key (hoặc bạn không quản lý key này)" }, { status: 404 });
        }
        // If this edit left the key multi-account but still mt5-pinned, unlock it.
        await reconcilePreboundLock(client, id);
        return NextResponse.json({ success: true });
      }

      /* ---- delete a key ---- */
      case "delete": {
        const { id } = body as { id?: string };
        if (!id) return NextResponse.json({ error: "Thiếu license id" }, { status: 400 });
        let q = client.from("license_keys").delete().eq("id", id);
        if (!isSuper) q = q.eq("managed_by", admin.user_id);
        const { error } = await q;
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
      }

      /* ---- unbind one activated MT5 device ---- */
      case "remove_device": {
        const { deviceId } = body as { deviceId?: string };
        if (!deviceId) return NextResponse.json({ error: "Thiếu device id" }, { status: 400 });

        // Sub-admins may only unbind devices on keys they manage.
        if (!isSuper) {
          const { data: dev } = await client
            .from("license_devices")
            .select("license_id")
            .eq("id", deviceId)
            .single();
          if (dev) {
            const { data: lic } = await client
              .from("license_keys")
              .select("managed_by")
              .eq("id", dev.license_id)
              .single();
            if (!lic || lic.managed_by !== admin.user_id) {
              return NextResponse.json({ error: "Không có quyền với key này" }, { status: 403 });
            }
          }
        }
        const { error } = await client.from("license_devices").delete().eq("id", deviceId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
      }

      /* ---- manually register an MT5 account on a key ---- */
      case "add_device": {
        const { licenseId, mt5Account } = body as { licenseId?: string; mt5Account?: string };
        const acct = mt5Account?.trim();
        if (!licenseId || !acct) return NextResponse.json({ error: "Thiếu license hoặc số tài khoản MT5" }, { status: 400 });

        const { data: lic } = await client
          .from("license_keys")
          .select("managed_by, max_accounts")
          .eq("id", licenseId)
          .single();
        if (!lic) return NextResponse.json({ error: "Không tìm thấy key" }, { status: 404 });
        if (!isSuper && lic.managed_by !== admin.user_id) {
          return NextResponse.json({ error: "Không có quyền với key này" }, { status: 403 });
        }

        const { count } = await client
          .from("license_devices")
          .select("*", { count: "exact", head: true })
          .eq("license_id", licenseId);
        const max = lic.max_accounts ?? 2;
        if ((count ?? 0) >= max) {
          return NextResponse.json({ error: `Đã đạt giới hạn ${max} tài khoản. Tăng "Max accounts" trước khi thêm.` }, { status: 409 });
        }

        const { error } = await client.from("license_devices").insert({ license_id: licenseId, mt5_account: acct });
        if (error) {
          if (error.code === "23505") return NextResponse.json({ error: "Tài khoản MT5 này đã được bind vào key" }, { status: 409 });
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true });
      }

      /* ---- change the MT5 account number on a bound device ---- */
      case "edit_device": {
        const { deviceId, mt5Account } = body as { deviceId?: string; mt5Account?: string };
        const acct = mt5Account?.trim();
        if (!deviceId || !acct) return NextResponse.json({ error: "Thiếu device id hoặc số tài khoản MT5" }, { status: 400 });

        if (!isSuper) {
          const { data: dev } = await client.from("license_devices").select("license_id").eq("id", deviceId).single();
          if (dev) {
            const { data: lic } = await client.from("license_keys").select("managed_by").eq("id", dev.license_id).single();
            if (!lic || lic.managed_by !== admin.user_id) {
              return NextResponse.json({ error: "Không có quyền với key này" }, { status: 403 });
            }
          }
        }
        const { error } = await client.from("license_devices").update({ mt5_account: acct }).eq("id", deviceId);
        if (error) {
          if (error.code === "23505") return NextResponse.json({ error: "Tài khoản MT5 này đã được bind vào key" }, { status: 409 });
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (e) {
    console.error("[Admin Licenses POST]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
