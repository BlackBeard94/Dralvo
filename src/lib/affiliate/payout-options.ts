/**
 * Affiliate payout destinations.
 *
 * Vietnam → bank transfer (bank + account number + holder).
 * International → USDT only, on a user-chosen network.
 *
 * The structured destination is JSON-encoded into `affiliate_payouts.method`
 * (no extra column / migration needed — that column was reserved for this).
 */

/** Major Vietnamese banks + common e-wallets (value = display label). */
export const VN_BANKS = [
  "Vietcombank",
  "Techcombank",
  "BIDV",
  "VietinBank",
  "MB Bank",
  "ACB",
  "VPBank",
  "Sacombank",
  "TPBank",
  "Agribank",
  "MSB",
  "SHB",
  "VIB",
  "HDBank",
  "OCB",
  "SeABank",
  "Eximbank",
  "Nam A Bank",
  "LPBank",
  "SCB",
  "ABBANK",
  "PVcomBank",
  "Bac A Bank",
  "BVBank",
  "Kienlongbank",
  "VietABank",
  "NCB",
  "Vietbank",
  "Shinhan Bank",
  "Momo",
  "ZaloPay",
  "ViettelMoney",
] as const;

export type UsdtNetwork = "TRC20" | "BEP20" | "ERC20" | "Solana" | "Polygon";

/** Supported USDT networks. `address` regex is a light sanity check. */
export const USDT_NETWORKS: { value: UsdtNetwork; label: string; hint: string; address: RegExp }[] = [
  { value: "TRC20", label: "TRC20 (Tron)", hint: "Phí thấp — khuyến nghị", address: /^T[1-9A-HJ-NP-Za-km-z]{33}$/ },
  { value: "BEP20", label: "BEP20 (BNB Smart Chain)", hint: "0x… 42 ký tự", address: /^0x[0-9a-fA-F]{40}$/ },
  { value: "ERC20", label: "ERC20 (Ethereum)", hint: "Phí mạng cao", address: /^0x[0-9a-fA-F]{40}$/ },
  { value: "Solana", label: "Solana (SPL)", hint: "Địa chỉ base58", address: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/ },
  { value: "Polygon", label: "Polygon (PoS)", hint: "0x… 42 ký tự", address: /^0x[0-9a-fA-F]{40}$/ },
];

export type PayoutMethod =
  | { type: "vn_bank"; bank: string; account: string; holder: string }
  | { type: "usdt"; network: UsdtNetwork; address: string };

export type PayoutMethodValidation =
  | { ok: true; value: PayoutMethod }
  | { ok: false; error: string };

const isVnBank = (b: unknown): b is string =>
  typeof b === "string" && (VN_BANKS as readonly string[]).includes(b);

/** Validate a raw payout-method payload from the client. */
export function validatePayoutMethod(input: unknown): PayoutMethodValidation {
  if (!input || typeof input !== "object") return { ok: false, error: "missing_method" };
  const m = input as Record<string, unknown>;

  if (m.type === "vn_bank") {
    const bank = typeof m.bank === "string" ? m.bank.trim() : "";
    const account = typeof m.account === "string" ? m.account.trim() : "";
    const holder = typeof m.holder === "string" ? m.holder.trim() : "";
    if (!isVnBank(bank)) return { ok: false, error: "invalid_bank" };
    if (!/^\d{6,19}$/.test(account)) return { ok: false, error: "invalid_account" };
    if (holder.length < 2 || holder.length > 100) return { ok: false, error: "invalid_holder" };
    return { ok: true, value: { type: "vn_bank", bank, account, holder } };
  }

  if (m.type === "usdt") {
    const net = USDT_NETWORKS.find((n) => n.value === m.network);
    const address = typeof m.address === "string" ? m.address.trim() : "";
    if (!net) return { ok: false, error: "invalid_network" };
    if (!net.address.test(address)) return { ok: false, error: "invalid_address" };
    return { ok: true, value: { type: "usdt", network: net.value, address } };
  }

  return { ok: false, error: "invalid_type" };
}

/** Parse the JSON-encoded `method` column back into a PayoutMethod (or null). */
export function parsePayoutMethod(method: string | null): PayoutMethod | null {
  if (!method) return null;
  try {
    const parsed = validatePayoutMethod(JSON.parse(method));
    return parsed.ok ? parsed.value : null;
  } catch {
    return null;
  }
}

/** One-line human summary for admin display. */
export function formatPayoutMethod(m: PayoutMethod | null): string {
  if (!m) return "—";
  if (m.type === "vn_bank") return `${m.bank} · ${m.account} · ${m.holder}`;
  return `USDT ${m.network} · ${m.address}`;
}
