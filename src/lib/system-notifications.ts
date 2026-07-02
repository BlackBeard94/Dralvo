import { getSupabaseAdminClient } from "@/lib/supabase/server";

type AdminClient = NonNullable<ReturnType<typeof getSupabaseAdminClient>>;

/**
 * Create a system notification targeted at a single user (dashboard bell).
 * Best-effort + never throws.
 */
export async function notifyUser(
  userId: string,
  n: { title: string; body?: string | null; level?: "info" | "success" | "warning" | "promo"; href?: string | null },
): Promise<void> {
  try {
    const admin = getSupabaseAdminClient();
    if (!admin) return;
    await admin.from("system_notifications").insert({
      audience: "user",
      user_id: userId,
      title: n.title,
      body: n.body ?? null,
      level: n.level ?? "info",
      href: n.href ?? null,
      // Personal auto-notifications (welcome / VIP / commission) live in the
      // bell + inbox only — never scroll in the marquee ticker.
      show_in_ticker: false,
    });
  } catch (e) {
    console.error("[notifyUser]", e);
  }
}

export type SystemNotificationRow = {
  id: string;
  title: string;
  body: string | null;
  level: string;
  href: string | null;
  audience: string;
  user_id: string | null;
  created_at: string;
  expires_at: string | null;
};

export const SYSTEM_NOTIFICATION_LEVELS = ["info", "success", "warning", "promo"] as const;
export const SYSTEM_NOTIFICATION_AUDIENCES = ["all", "vip", "free", "user"] as const;

/**
 * Fetch the system notifications that apply to a user right now — broadcasts for
 * their tier plus notifications targeted directly at them — excluding expired or
 * not-yet-started ones. Reads scoped via the admin client.
 */
export async function fetchApplicableSystemNotifications(
  admin: AdminClient,
  userId: string,
  isVip: boolean,
): Promise<SystemNotificationRow[]> {
  const nowIso = new Date().toISOString();
  const { data } = await admin
    .from("system_notifications")
    .select("id, title, body, level, href, audience, user_id, created_at, expires_at, show_in_ticker, title_i18n, body_i18n")
    // Broadcasts (audience != 'user') or notifications targeted at this user.
    .or(`audience.neq.user,user_id.eq.${userId}`)
    .lte("starts_at", nowIso)
    .order("created_at", { ascending: false })
    .limit(50);

  const now = Date.now();
  return ((data ?? []) as SystemNotificationRow[]).filter((s) => {
    if (s.expires_at && new Date(s.expires_at).getTime() <= now) return false;
    switch (s.audience) {
      case "all":
        return true;
      case "vip":
        return isVip;
      case "free":
        return !isVip;
      case "user":
        return s.user_id === userId;
      default:
        return false;
    }
  });
}
