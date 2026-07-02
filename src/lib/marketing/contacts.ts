/**
 * Capture a customer email into the marketing contact list (for later email
 * marketing). One row per email; best-effort + never throws.
 */
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export async function captureMarketingContact(
  userId: string | null,
  email: string | null,
  source: string,
): Promise<void> {
  try {
    if (!email) return;
    const client = getSupabaseAdminClient();
    if (!client) return;
    await client
      .from("marketing_contacts")
      .upsert(
        { email: email.toLowerCase(), user_id: userId, source },
        { onConflict: "email", ignoreDuplicates: true },
      );
  } catch (err) {
    console.error("[captureMarketingContact]", err);
  }
}
