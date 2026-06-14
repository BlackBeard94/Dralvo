import { describe, expect, it } from "vitest";

import {
  hasProAccess,
  planStatusLabel,
  planTierForStatus,
} from "./stripe-subscriptions";

describe("Stripe subscription helpers", () => {
  it("treats active and trialing subscriptions as Pro access", () => {
    expect(hasProAccess("active")).toBe(true);
    expect(hasProAccess("trialing")).toBe(true);
    expect(hasProAccess("canceled")).toBe(false);
    expect(hasProAccess("past_due")).toBe(false);
    expect(hasProAccess(null)).toBe(false);
  });

  it("maps subscription status to plan tier", () => {
    expect(planTierForStatus("active")).toBe("Pro");
    expect(planTierForStatus("trialing")).toBe("Pro");
    expect(planTierForStatus("canceled")).toBe("Free");
  });

  it("maps subscription status to UI labels", () => {
    expect(planStatusLabel("active")).toBe("Pro");
    expect(planStatusLabel("trialing")).toBe("Trialing");
    expect(planStatusLabel("canceled")).toBe("Canceled");
    expect(planStatusLabel("past_due")).toBe("Past due");
    expect(planStatusLabel(undefined)).toBe("Free");
  });
});
