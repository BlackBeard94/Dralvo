import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * Shared license-granting logic used by the admin panel and the agent ops API.
 * Finds a user by email and upserts license_keys on (user_id, product) so it is
 * idempotent — re-running tops up missing EAs without clobbering existing keys.
 */

export const GRANT_PRODUCTS = ["goldmaster", "goldscalp", "tigold", "goldwave"] as const;
export type GrantProduct = (typeof GRANT_PRODUCTS)[number];
export const GRANT_PLANS = ["tigold", "unlimited"] as const;
export type GrantPlan = (typeof GRANT_PLANS)[number];

/**
 * Free trial length (days) for every EA granted through the IB flow. All 4 EAs
 * are now free-to-try: opening a GTC account under Dralvo's IB earns a key that
 * runs for TRIAL_DAYS, then expires (renew by contacting the admin). Keep in one
 * place so the grant, dashboard, and bot messaging all agree.
 */
export const TRIAL_DAYS = 3;
const DAY_MS = 86_400_000;

const DEFAULT_MAX: Record<GrantProduct, number> = { goldmaster: 2, goldscalp: 2, tigold: 1, goldwave: 1 };

export const isGrantProduct = (p: unknown): p is GrantProduct =>
  typeof p === "string" && (GRANT_PRODUCTS as readonly string[]).includes(p);
export const isGrantPlan = (p: unknown): p is GrantPlan =>
  typeof p === "string" && (GRANT_PLANS as readonly string[]).includes(p);

type Client = NonNullable<ReturnType<typeof getSupabaseAdminClient>>;

async function findUserByEmail(client: Client, email: string): Promise<{ id: string } | null> {
  const { data } = await client.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const ql = email.trim().toLowerCase();
  const u = (data?.users ?? []).find((x) => x.email?.toLowerCase() === ql);
  return u ? { id: u.id } : null;
}

export type GrantInput = {
  email: string;
  plan: GrantPlan;
  product?: GrantProduct;
  allProducts?: boolean;
  maxAccounts?: number;
  managedBy?: string | null;
  /** Bind the license to a specific MT5 account. Only applied to the `tigold`
   *  product (free IB license = 1 account); VIP products stay unbound. */
  mt5Account?: string | null;
  /** When set to a positive number, the key is a trial that expires after this
   *  many days (is_lifetime=false). Omit/null for a permanent comp (admin). */
  expiresInDays?: number | null;
};

export type GrantResult =
  | { ok: true; products: GrantProduct[] }
  | { ok: false; error: string; status: number };

export async function grantLicense(input: GrantInput): Promise<GrantResult> {
  const client = getSupabaseAdminClient();
  if (!client) return { ok: false, error: "server_config", status: 500 };
  if (!input.email) return { ok: false, error: "email_required", status: 400 };
  if (!isGrantPlan(input.plan)) return { ok: false, error: "invalid_plan", status: 400 };

  const user = await findUserByEmail(client, input.email);
  if (!user) return { ok: false, error: "user_not_found", status: 404 };

  const managed_by = input.managedBy ?? null;
  const targets: GrantProduct[] = input.allProducts
    ? [...GRANT_PRODUCTS]
    : isGrantProduct(input.product)
      ? [input.product]
      : [];
  if (targets.length === 0) return { ok: false, error: "invalid_product", status: 400 };

  const boundMt5 = typeof input.mt5Account === "string" && input.mt5Account.trim() ? input.mt5Account.trim() : null;
  // Trial grant: a positive expiresInDays makes a time-limited key; otherwise the
  // grant is a permanent lifetime comp (null expiry).
  const trialDays =
    typeof input.expiresInDays === "number" && input.expiresInDays > 0 ? Math.floor(input.expiresInDays) : null;
  const trialExpiresAt = trialDays ? new Date(Date.now() + trialDays * DAY_MS).toISOString() : null;
  const rows = targets.map((p) => ({
    user_id: user.id,
    product: p,
    plan: input.plan,
    managed_by,
    expires_at: trialExpiresAt,
    is_lifetime: trialDays ? false : true,
    // Only the free tigold IB license is pinned to one MT5 account.
    mt5_account: p === "tigold" ? boundMt5 : null,
    max_accounts:
      typeof input.maxAccounts === "number" && input.maxAccounts >= 1 ? input.maxAccounts : DEFAULT_MAX[p],
  }));

  const { error } = await client.from("license_keys").upsert(rows, { onConflict: "user_id,product" });
  if (error) return { ok: false, error: error.message, status: 500 };
  return { ok: true, products: targets };
}
