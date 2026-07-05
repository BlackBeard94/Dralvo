import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

type Client = NonNullable<ReturnType<typeof getSupabaseAdminClient>>;

export type ReferralSource = { type: "affiliate" | "partner"; email: string | null };

/**
 * Which affiliate/partner link a customer came from. Single-owner attribution:
 * profiles.referrer_type/referrer_id → the affiliate|partner account → email.
 * Returns null for direct signups.
 */
export async function getReferralSource(
  sb: Client,
  userId: string,
): Promise<ReferralSource | null> {
  const { data: profile } = await sb
    .from("profiles")
    .select("referrer_type, referrer_id")
    .eq("id", userId)
    .maybeSingle();

  const refType = profile?.referrer_type as string | null;
  const refId = profile?.referrer_id as string | null;
  if (!refId || (refType !== "affiliate" && refType !== "partner")) return null;

  const { data: ref } = await sb
    .from(refType === "partner" ? "partners" : "affiliates")
    .select("user_id")
    .eq("id", refId)
    .maybeSingle();
  const refUserId = ref?.user_id as string | undefined;
  if (!refUserId) return { type: refType, email: null };

  const { data: refUser } = await sb.auth.admin.getUserById(refUserId);
  return { type: refType, email: refUser?.user?.email ?? null };
}
