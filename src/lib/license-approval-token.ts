import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed one-tap approval token for the account-based license flow.
 * Payload signed: grant1.<userId>.<product>.<exp>  (exp = unix seconds).
 * Binding the product means the approve link can only grant the exact EA the
 * customer requested — it can't be tampered to hand out a different one.
 * Shared secret: LICENSE_APPROVE_SECRET (same as the MT5 license-approve links).
 */
const PREFIX = "grant1";

export function signGrantToken(secret: string, userId: string, product: string, exp: number): string {
  return createHmac("sha256", secret).update(`${PREFIX}.${userId}.${product}.${exp}`).digest("hex");
}

export function verifyGrantToken(
  secret: string,
  userId: string,
  product: string,
  exp: number,
  sig: string,
): boolean {
  const expected = signGrantToken(secret, userId, product, exp);
  const a = Buffer.from(sig, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}
