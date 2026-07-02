/**
 * Admin auth — shared by API routes and server components.
 * ponytail: single isAdmin() check + can() permission guard, replaces the
 * two duplicate isAdmin() functions in /api/admin/affiliate/* routes.
 */
import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { AdminUser, AdminPermissions, AdminPermissionAction } from "./types";

/**
 * Resolve the current logged-in user's admin row (or null).
 * Wrapped in React `cache()` so it de-dupes within ONE request (layout + page)
 * but is NEVER cached across requests — permission changes take effect on the
 * next navigation/refresh (no stale globalThis cache, no server restart needed).
 */
export const getAdmin = cache(async (): Promise<AdminUser | null> => {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        // Persist a refreshed session when auth.getUser() rotates the token.
        // The proxy skips getUser() for self-guarded API routes (perf), so this
        // is what keeps admin sessions alive during long polling. Wrapped in
        // try/catch: cookies() is read-only in Server Components (only writable
        // in Route Handlers / Server Actions) → silently ignore there.
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch { /* Server Component context — refresh handled on the next page load */ }
        },
      },
    },
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  // env var fallback — a user id listed here is treated as super_admin even
  // without an admin_users row. Prefer the clearly-named SUPER_ADMIN_IDS;
  // AFFILIATE_ADMIN_IDS is kept only for backward compat (its name is
  // misleading — it grants FULL super_admin, not just affiliate scope).
  const envIds = [
    ...(process.env.SUPER_ADMIN_IDS ?? "").split(","),
    ...(process.env.AFFILIATE_ADMIN_IDS ?? "").split(","),
  ].map((s) => s.trim()).filter(Boolean);
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
      return data[0] as AdminUser;
    }
  }

  // DB path 2: authenticated user (needs RLS policy on admin_users)
  const { data: authData, error: authErr } = await supabase
    .from("admin_users")
    .select("*")
    .eq("user_id", user.id)
    .limit(1);
  if (!authErr && authData && authData.length > 0) {
    return authData[0] as AdminUser;
  }

  // Env var fallback
  if (envFallback) {
    const synthetic: AdminUser = {
      id: user.id,
      user_id: user.id,
      role: "super_admin",
      permissions: {
        users: { view: true, edit: true },
        license: { manage: true },
        finance: { view: true },
        marketing: { view: true },
        affiliate: { manage: true },
        admins: { manage: true },
      },
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return synthetic;
  }

  return null;
});

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
 * Fetch emails for many user IDs in ONE targeted query.
 * Reads `profiles.email` (kept in sync on signup) filtered by the exact ids —
 * an indexed `.in("id", …)` lookup. Much faster than auth.admin.listUsers()
 * (which is a slow GoTrue round-trip capped at 100 users) and it scales past
 * 100. Any id without a profile row resolves to null.
 */
async function batchGetEmails(
  adminClient: ReturnType<typeof getSupabaseAdminClient>,
  userIds: string[],
): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  if (!adminClient || userIds.length === 0) return map;

  const unique = [...new Set(userIds)];
  const { data } = await adminClient.from("profiles").select("id, email").in("id", unique);
  for (const row of data ?? []) map.set(row.id as string, (row.email as string | null) ?? null);
  // Guarantee every requested id is present (null if it has no profile row).
  for (const uid of unique) if (!map.has(uid)) map.set(uid, null);
  return map;
}

/** Public helper for API routes that need user emails in bulk */
export { batchGetEmails };

// Re-export for convenience
export type { AdminUser, AdminPermissions, AdminPermissionAction };
