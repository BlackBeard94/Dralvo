import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

const mocks = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  getSupabaseAdminClient: vi.fn(),
  hasProAccess: vi.fn(),
  upsertProSubscriptionFromCheckoutSession: vi.fn(),
  recordRunLog: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    webhooks: {
      constructEvent: mocks.constructEvent,
    },
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseAdminClient: mocks.getSupabaseAdminClient,
}));

vi.mock("@/lib/stripe-subscriptions", () => ({
  hasProAccess: mocks.hasProAccess,
  upsertProSubscriptionFromCheckoutSession:
    mocks.upsertProSubscriptionFromCheckoutSession,
  periodEndFromPlan: () => "2030-01-01T00:00:00.000Z",
  subscriptionPeriodEndIso: () => "2030-01-01T00:00:00.000Z",
}));

vi.mock("@/lib/run-logs", () => ({
  recordRunLog: mocks.recordRunLog,
}));

import { POST } from "./route";

function stripeRequest() {
  return new Request("https://dralvo.test/api/stripe/webhook", {
    method: "POST",
    headers: {
      "stripe-signature": "test-signature",
    },
    body: JSON.stringify({ ok: true }),
  }) as never;
}

// Chainable Supabase stub: every builder method returns the same chain (so it
// supports select/insert/upsert/update/delete + eq/in/lte/order/limit), the
// chain is awaitable (thenable) and single()/maybeSingle() resolve to `result`.
// `update` and `eq` are exposed so tests can assert on them.
function supabaseMock() {
  const result: { data: unknown; error: unknown } = { data: null, error: null };
  const chain: Record<string, unknown> = {};
  const ret = () => chain;
  for (const m of ["select", "insert", "upsert", "update", "delete", "eq", "in", "lte", "order", "limit"]) {
    chain[m] = vi.fn(ret);
  }
  chain.single = vi.fn(() => Promise.resolve(result));
  chain.maybeSingle = vi.fn(() => Promise.resolve(result));
  chain.then = (resolve: (v: typeof result) => unknown) => resolve(result);
  return {
    update: chain.update as ReturnType<typeof vi.fn>,
    eq: chain.eq as ReturnType<typeof vi.fn>,
    client: {
      from: vi.fn(() => chain),
    },
  };
}

describe("/api/stripe/webhook lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    mocks.hasProAccess.mockImplementation((status) => status === "active" || status === "trialing");
  });

  it("rejects invalid signatures", async () => {
    mocks.constructEvent.mockImplementation(() => {
      throw new Error("bad signature");
    });

    const response = await POST(stripeRequest());

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid signature." });
  });

  it("processes checkout.session.completed", async () => {
    const db = supabaseMock();
    const event = {
      id: "evt_checkout",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test",
          client_reference_id: "user-1",
        },
      },
    } as Stripe.Event;

    mocks.constructEvent.mockReturnValue(event);
    mocks.getSupabaseAdminClient.mockReturnValue(db.client);

    const response = await POST(stripeRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true });
    expect(mocks.upsertProSubscriptionFromCheckoutSession).toHaveBeenCalledWith(
      event.data.object,
    );
    expect(mocks.recordRunLog).toHaveBeenCalledWith(
      expect.objectContaining({
        runType: "stripe_webhook",
        status: "success",
        metadata: {
          event_id: "evt_checkout",
          event_type: "checkout.session.completed",
        },
      }),
    );
  });

  it("syncs active subscription updates to Pro", async () => {
    const db = supabaseMock();
    mocks.constructEvent.mockReturnValue({
      id: "evt_updated",
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_123",
          status: "trialing",
          current_period_end: 1781000000,
        },
      },
    });
    mocks.getSupabaseAdminClient.mockReturnValue(db.client);

    const response = await POST(stripeRequest());

    expect(response.status).toBe(200);
    expect(db.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "trialing",
        plan: "pro",
        plan_tier: "Pro",
      }),
    );
    expect(db.eq).toHaveBeenCalledWith("stripe_subscription_id", "sub_123");
  });

  it("downgrades past_due subscriptions to Free", async () => {
    const db = supabaseMock();
    mocks.constructEvent.mockReturnValue({
      id: "evt_past_due",
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_past_due",
          status: "past_due",
          current_period_end: 1781000000,
        },
      },
    });
    mocks.getSupabaseAdminClient.mockReturnValue(db.client);

    const response = await POST(stripeRequest());

    expect(response.status).toBe(200);
    expect(db.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "past_due",
        plan: "free",
        plan_tier: "Free",
      }),
    );
    expect(db.eq).toHaveBeenCalledWith("stripe_subscription_id", "sub_past_due");
  });

  it("downgrades deleted subscriptions to Free", async () => {
    const db = supabaseMock();
    mocks.constructEvent.mockReturnValue({
      id: "evt_deleted",
      type: "customer.subscription.deleted",
      data: {
        object: {
          id: "sub_456",
        },
      },
    });
    mocks.getSupabaseAdminClient.mockReturnValue(db.client);

    const response = await POST(stripeRequest());

    expect(response.status).toBe(200);
    expect(db.update).toHaveBeenCalledWith({
      status: "canceled",
      plan: "free",
      plan_tier: "Free",
    });
    expect(db.eq).toHaveBeenCalledWith("stripe_subscription_id", "sub_456");
  });
});
