/**
 * Admin event feed — record "something changed" events for the backoffice bell.
 * Best-effort + never throws (must not break the user-facing action it hooks).
 */
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export type AdminEventType =
  | "user_signup"
  | "affiliate_signup"
  | "payment_success"
  | "partner_created"
  | "payout_request"
  | "other";

export interface AdminEvent {
  id: string;
  type: AdminEventType;
  title: string;
  message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export async function recordAdminEvent(e: {
  type: AdminEventType;
  title: string;
  message?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const client = getSupabaseAdminClient();
    if (!client) return;
    await client.from("admin_events").insert({
      type: e.type,
      title: e.title,
      message: e.message ?? null,
      metadata: e.metadata ?? {},
    });
  } catch (err) {
    console.error("[recordAdminEvent]", err);
  }
}
