import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed one-tap approval token for the account-based free-license flow.
 * Payload signed: grant1.<userId>.<exp>  (exp = unix seconds).
 * Shared secret: LICENSE_APPROVE_SECRET (same as the MT5 license-approve links).
 */
const PREFIX = "grant1";

export function signGrantToken(secret: string, userId: string, exp: number): string {
  return createHmac("sha256", secret).update(`${PREFIX}.${userId}.${exp}`).digest("hex");
}

export function verifyGrantToken(
  secret: string,
  userId: string,
  exp: number,
  sig: string,
): boolean {
  const expected = signGrantToken(secret, userId, exp);
  const a = Buffer.from(sig, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}
