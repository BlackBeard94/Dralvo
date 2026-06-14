import { createServerClient } from "@supabase/ssr";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  syncCheckoutSession: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

vi.mock("@/lib/stripe-subscriptions", () => ({
  syncCheckoutSession: mocks.syncCheckoutSession,
}));

import { GET } from "./route";

const createServerClientMock = vi.mocked(createServerClient);

function request(url: string) {
  return new NextRequest(url);
}

function mockUser(user: { id: string } | null, error: Error | null = null) {
  createServerClientMock.mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error }),
    },
  } as never);
}

describe("GET /api/stripe/checkout/success", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.test";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
  });

  it("redirects missing Stripe sessions to the dashboard missing-session notice", async () => {
    const response = await GET(
      request("https://www.dralvo.com/api/stripe/checkout/success"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://www.dralvo.com/dashboard?checkout=missing_session",
    );
  });

  it("preserves a sync-failed notice through login when auth cookies are missing", async () => {
    mockUser(null);

    const response = await GET(
      request("https://www.dralvo.com/api/stripe/checkout/success?session_id=cs_test"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://www.dralvo.com/login?redirect=%2Fdashboard%3Fcheckout%3Dsync_failed",
    );
  });

  it("syncs the checkout session for authenticated users", async () => {
    mockUser({ id: "user-1" });
    mocks.syncCheckoutSession.mockResolvedValue(undefined);

    const response = await GET(
      request("https://www.dralvo.com/api/stripe/checkout/success?session_id=cs_test"),
    );

    expect(mocks.syncCheckoutSession).toHaveBeenCalledWith("cs_test", "user-1");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://www.dralvo.com/dashboard?checkout=success",
    );
  });

  it("redirects to the dashboard sync-failed notice when session sync fails", async () => {
    mockUser({ id: "user-1" });
    mocks.syncCheckoutSession.mockRejectedValue(new Error("stripe unavailable"));

    const response = await GET(
      request("https://www.dralvo.com/api/stripe/checkout/success?session_id=cs_test"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://www.dralvo.com/dashboard?checkout=sync_failed",
    );
  });
});
