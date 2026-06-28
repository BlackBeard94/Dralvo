import { describe, expect, it } from "vitest";

import { evaluateDeviceBinding } from "./license-devices";

describe("evaluateDeviceBinding", () => {
  it("allows an already-registered account without re-inserting", () => {
    expect(evaluateDeviceBinding(["111", "222"], "111", 2)).toEqual({
      allowed: true,
      isNew: false,
    });
  });

  it("registers a new account while under the cap", () => {
    expect(evaluateDeviceBinding(["111"], "222", 2)).toEqual({
      allowed: true,
      isNew: true,
    });
  });

  it("rejects a new account once the cap is reached", () => {
    expect(evaluateDeviceBinding(["111", "222"], "333", 2)).toEqual({
      allowed: false,
      isNew: true,
      reason: "account_limit",
    });
  });

  it("still allows known accounts even at the cap", () => {
    expect(evaluateDeviceBinding(["111", "222"], "222", 2)).toEqual({
      allowed: true,
      isNew: false,
    });
  });

  it("treats max_accounts below 1 as 1", () => {
    expect(evaluateDeviceBinding([], "111", 0)).toEqual({
      allowed: true,
      isNew: true,
    });
    expect(evaluateDeviceBinding(["111"], "222", 0)).toEqual({
      allowed: false,
      isNew: true,
      reason: "account_limit",
    });
  });
});
