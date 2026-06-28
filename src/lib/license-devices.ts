// Anti-sharing for `unlimited` licenses: bind a license to a limited set of
// MT5 accounts on a trust-on-first-use basis. The first `max_accounts` distinct
// accounts that present the key are registered; any further account is rejected.

export type DeviceBindingReason = "account_limit";

export interface DeviceBindingDecision {
  /** Whether this account is allowed to use the license. */
  allowed: boolean;
  /** True when the account is not yet registered (needs an insert). */
  isNew: boolean;
  reason?: DeviceBindingReason;
}

/**
 * Decide whether an MT5 account may use a license given the accounts already
 * bound to it. Pure — the caller performs the DB read/write.
 */
export function evaluateDeviceBinding(
  knownAccounts: string[],
  account: string,
  maxAccounts: number,
): DeviceBindingDecision {
  if (knownAccounts.includes(account)) {
    return { allowed: true, isNew: false };
  }
  if (knownAccounts.length < Math.max(1, maxAccounts)) {
    return { allowed: true, isNew: true };
  }
  return { allowed: false, isNew: true, reason: "account_limit" };
}
