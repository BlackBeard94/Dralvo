import { describe, expect, it } from "vitest";
import type Stripe from "stripe";

import {
  hasProAccess,
  periodEndFromPlan,
  planStatusLabel,
  planTierForStatus,
  subscriptionPeriodEndIso,
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

describe("period-end derivation (rental model)", () => {
  const FROM = new Date("2026-01-15T00:00:00Z");

  it("derives a concrete expiry from the purchased plan period", () => {
    expect(periodEndFromPlan("monthly", FROM)).toBe("2026-02-15T00:00:00.000Z");
    expect(periodEndFromPlan("sixmo", FROM)).toBe("2026-07-15T00:00:00.000Z");
    expect(periodEndFromPlan("yearly", FROM)).toBe("2027-01-15T00:00:00.000Z");
  });

  it("defaults an unknown/missing period to monthly", () => {
    expect(periodEndFromPlan(undefined, FROM)).toBe("2026-02-15T00:00:00.000Z");
    expect(periodEndFromPlan("bogus", FROM)).toBe("2026-02-15T00:00:00.000Z");
  });

  it("reads current_period_end from the subscription root", () => {
    const sub = {
      current_period_end: 1781000000,
      items: { data: [] },
      metadata: {},
    } as unknown as Stripe.Subscription;
    expect(subscriptionPeriodEndIso(sub)).toBe(
      new Date(1781000000 * 1000).toISOString(),
    );
  });

  it("falls back to the subscription item period end (Stripe basil+)", () => {
    const sub = {
      items: { data: [{ current_period_end: 1781000000 }] },
      metadata: {},
    } as unknown as Stripe.Subscription;
    expect(subscriptionPeriodEndIso(sub)).toBe(
      new Date(1781000000 * 1000).toISOString(),
    );
  });

  it("falls back to the plan period when Stripe omits the period end", () => {
    const sub = {
      items: { data: [{}] },
      metadata: { period: "yearly" },
    } as unknown as Stripe.Subscription;
    // Never null — a concrete future ISO string.
    expect(subscriptionPeriodEndIso(sub)).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
