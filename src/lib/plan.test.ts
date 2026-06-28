import { describe, expect, it } from "vitest";

import { resolvePlan } from "./plan";

const NOW = new Date("2026-06-28T00:00:00Z");
const FUTURE = "2026-12-01T00:00:00Z";
const PAST = "2026-01-01T00:00:00Z";

describe("resolvePlan", () => {
  it("returns Free when there is no license or subscription", () => {
    expect(resolvePlan(null, null, NOW).planTier).toBe("Free");
  });

  it("grants Unlimited for a lifetime comp with null expiry", () => {
    const r = resolvePlan(
      { plan: "unlimited", expires_at: null, is_lifetime: true },
      null,
      NOW,
    );
    expect(r.planTier).toBe("Unlimited");
    expect(r.planSource).toBe("license");
  });

  it("grants Unlimited for a license with a future expiry", () => {
    const r = resolvePlan(
      { plan: "unlimited", expires_at: FUTURE, is_lifetime: false },
      null,
      NOW,
    );
    expect(r.planTier).toBe("Unlimited");
  });

  it("denies a license whose expiry has lapsed", () => {
    const r = resolvePlan(
      { plan: "unlimited", expires_at: PAST, is_lifetime: false },
      null,
      NOW,
    );
    expect(r.planTier).toBe("Free");
  });

  it("denies a non-lifetime license with a null expiry (bug guard)", () => {
    const r = resolvePlan(
      { plan: "unlimited", expires_at: null, is_lifetime: false },
      null,
      NOW,
    );
    expect(r.planTier).toBe("Free");
  });

  it("grants Unlimited for an active Stripe subscription", () => {
    const r = resolvePlan(
      null,
      {
        status: "active",
        stripe_subscription_id: "sub_123",
        current_period_end: FUTURE,
      },
      NOW,
    );
    expect(r.planTier).toBe("Unlimited");
    expect(r.planSource).toBe("subscription");
  });

  it("denies a non-Stripe subscription whose period has lapsed", () => {
    // VietQR / manual sub: a one-off payment must not grant indefinite access.
    const r = resolvePlan(
      null,
      { status: "active", stripe_subscription_id: null, current_period_end: PAST },
      NOW,
    );
    expect(r.planTier).toBe("Free");
  });

  it("grants Unlimited for a non-Stripe subscription still within its period", () => {
    const r = resolvePlan(
      null,
      { status: "active", stripe_subscription_id: null, current_period_end: FUTURE },
      NOW,
    );
    expect(r.planTier).toBe("Unlimited");
    expect(r.planSource).toBe("license");
  });
});
