// Server-side reconciliation between a key's IB single-account lock
// (`license_keys.mt5_account`) and its anti-share cap (`max_accounts`).
//
// Semantics: a key is hard-locked to one IB-verified account ONLY when it is a
// single-account key (max_accounts <= 1). Once a key becomes multi-account
// (max_accounts > 1), `max_accounts` is authoritative and binding happens via
// `license_devices`. A leftover `mt5_account` on such a row would otherwise
// silently pin the key to one account (and make admin's max edit a no-op), so
// we migrate that account into license_devices and clear the row lock.

import type { getSupabaseAdminClient } from "@/lib/supabase/server";

type Admin = NonNullable<ReturnType<typeof getSupabaseAdminClient>>;

/**
 * If the given key is multi-account (max_accounts > 1) but still carries an
 * `mt5_account` lock, move that account into license_devices (idempotent) and
 * null the lock. No-op for single-account or already-unlocked keys.
 */
export async function reconcilePreboundLock(admin: Admin, licenseId: string): Promise<void> {
  const { data: lic } = await admin
    .from("license_keys")
    .select("id, mt5_account, max_accounts")
    .eq("id", licenseId)
    .maybeSingle();

  if (!lic || !lic.mt5_account || (lic.max_accounts ?? 2) <= 1) return;

  await admin
    .from("license_devices")
    .upsert(
      { license_id: lic.id, mt5_account: lic.mt5_account },
      { onConflict: "license_id,mt5_account" },
    );
  await admin.from("license_keys").update({ mt5_account: null }).eq("id", lic.id);
}
