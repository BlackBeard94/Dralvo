/**
 * Partner auth — resolve the logged-in user's partner row (if any).
 * Separate from admin auth. No globalThis cache (so status/rate changes take
 * effect immediately). Used by the /partner portal + /api/partner routes.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { Partner } from "./types";

export async function getPartner(): Promise<Partner | null> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        // Persist refreshed session tokens (proxy skips getUser for these routes).
        // try/catch: cookies() is read-only in Server Components.
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch { /* Server Component — refresh on next page load */ }
        },
      },
    },
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const admin = getSupabaseAdminClient();
  if (!admin) return null;

  const { data } = await admin
    .from("partners")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  return (data as Partner | null) ?? null;
}
