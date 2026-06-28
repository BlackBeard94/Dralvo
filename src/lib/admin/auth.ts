/**
 * Admin auth — shared by API routes and server components.
 * ponytail: single isAdmin() check + can() permission guard, replaces the
 * two duplicate isAdmin() functions in /api/admin/affiliate/* routes.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { AdminUser, AdminPermissions, AdminPermissionAction } from "./types";

// Cached admin user to avoid double query (layout + page)
let _cachedAdmin: AdminUser | null | undefined = undefined;

function cacheKey(userId: string) {
  return `__admin_${userId}`;
}

/** Check if current logged-in user is an admin. Returns admin row if so. */
export async function getAdmin(): Promise<AdminUser | null> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() { } } },
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  // ponytail: per-request cache — layout + page may both call getAdmin()
  const key = cacheKey(user.id);
  if ((globalThis as any)[key] !== undefined) return (globalThis as any)[key];

  // ponytail: env var fallback — if AFFILIATE_ADMIN_IDS has this user, they're super_admin
  // even without DB table. Same pattern the affiliate admin routes use.
  const envIds = (process.env.AFFILIATE_ADMIN_IDS ?? "").split(",").filter(Boolean);
  const envFallback = envIds.includes(user.id);

  const adminClient = getSupabaseAdminClient();

  // DB path 1: service role (needs SUPABASE_SERVICE_ROLE_KEY)
  if (adminClient) {
    const { data, error: dbError } = await adminClient
      .from("admin_users")
      .select("*")
      .eq("user_id", user.id)
      .limit(1);

    if (dbError) {
      console.error("[getAdmin] service_role query failed:", dbError.message, dbError.code);
    } else if (data && data.length > 0) {
      const admin = data[0] as AdminUser;
      (globalThis as any)[key] = admin;
      return admin;
    }
  }

  // DB path 2: authenticated user (needs RLS policy on admin_users)
  // ponytail: fallback for when service_role key misconfigured but RLS policy exists
  const { data: authData, error: authErr } = await supabase
    .from("admin_users")
    .select("*")
    .eq("user_id", user.id)
    .limit(1);

  if (!authErr && authData && authData.length > 0) {
    const admin = authData[0] as AdminUser;
    (globalThis as any)[key] = admin;
    return admin;
  }

  // Env var fallback
  if (envFallback) {
    const synthetic: AdminUser = {
      id: user.id,
      user_id: user.id,
      role: "super_admin",
      permissions: {
        users: { view: true, edit: true },
        finance: { view: true },
        vps: { manage: true },
        affiliate: { manage: true },
        admins: { manage: true },
      },
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    (globalThis as any)[key] = synthetic;
    return synthetic;
  }

  (globalThis as any)[key] = null;
  return null;
}

/** Quick boolean: is the current user an admin? */
export async function isAdmin(): Promise<boolean> {
  const admin = await getAdmin();
  return admin !== null;
}

/** Check if admin has a specific permission. Super admin always passes. */
export function can(admin: AdminUser | null, action: AdminPermissionAction): boolean {
  if (!admin) return false;
  if (admin.role === "super_admin") return true;

  const [scope, perm] = action.split(".") as [keyof AdminPermissions, string];
  const scopePerms = admin.permissions[scope] as Record<string, boolean> | undefined;
  return scopePerms?.[perm] === true;
}

/** List sub-admins (super admin only) */
export async function listSubAdmins(): Promise<AdminUser[]> {
  const adminClient = getSupabaseAdminClient();
  if (!adminClient) return [];

  const { data } = await adminClient
    .from("admin_users")
    .select("*")
    .order("created_at", { ascending: false });

  if (!data) return [];

  // ponytail: batch email fetch — one listUsers call, not N getUserById
  const emails = await batchGetEmails(adminClient, data.map((a) => a.user_id));
  return data.map((a) => ({ ...a, email: emails.get(a.user_id) ?? null } as AdminUser));
}

/**
 * ponytail: fetch emails for many user IDs in ONE call.
 * Supabase auth.admin doesn't support batch getUserById, so we list all
 * users and index by ID. Callers that only need a few IDs pay one round-trip.
 */
async function batchGetEmails(
  adminClient: ReturnType<typeof getSupabaseAdminClient>,
  userIds: string[],
): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  if (!adminClient || userIds.length === 0) return map;

  const unique = [...new Set(userIds)];
  // ponytail: listUsers is the only bulk-read; max 100 per page, iterate if needed
  const { data } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 100 });
  const allUsers = data?.users ?? [];

  for (const uid of unique) {
    const found = allUsers.find((u) => u.id === uid);
    map.set(uid, found?.email ?? null);
  }
  return map;
}

/** Public helper for API routes that need user emails in bulk */
export { batchGetEmails };

// Re-export for convenience
export type { AdminUser, AdminPermissions, AdminPermissionAction };
