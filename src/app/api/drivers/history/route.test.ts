import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  getUserPlanTierByUserId: vi.fn(),
  limit: vi.fn(),
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock("@/lib/supabase/auth", () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
}));
vi.mock("@/lib/subscription-gate", () => ({
  getUserPlanTierByUserId: mocks.getUserPlanTierByUserId,
}));
vi.mock("@/lib/supabase/server", () => ({
  getSupabaseAdminClient: mocks.getSupabaseAdminClient,
}));

import { GET } from "./route";

function request(driver = "cftc-gold-positioning") {
  return new Request(
    `https://dralvo.test/api/drivers/history?driver=${driver}`,
    { headers: { "x-forwarded-for": "203.0.113.63" } },
  );
}

function query() {
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: mocks.limit,
  };
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.order.mockReturnValue(chain);
  return chain;
}

describe("GET /api/drivers/history", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const chain = query();
    mocks.getSupabaseAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    });
  });

  it("requires authentication", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue(null);
    expect((await GET(request())).status).toBe(401);
  });

  it("limits Free history to 12 observations", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "user-free" });
    mocks.getUserPlanTierByUserId.mockResolvedValue("Free");
    mocks.limit.mockResolvedValue({
      data: [
        {
          observed_at: "2025-01-07T00:00:00Z",
          numeric_value: 10,
          unit: "contracts",
          source_url: "https://www.cftc.gov/",
        },
      ],
      error: null,
    });

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.limit).toHaveBeenCalledWith(12);
    expect(body).toMatchObject({
      limited: true,
      planTier: "Free",
      points: [{ value: 10 }],
    });
  });

  it("rejects arbitrary driver keys", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "user-pro" });
    expect((await GET(request("unknown"))).status).toBe(400);
    expect(mocks.limit).not.toHaveBeenCalled();
  });

  it("supports GLD history with a 30-observation Free window", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "user-free" });
    mocks.getUserPlanTierByUserId.mockResolvedValue("Free");
    mocks.limit.mockResolvedValue({
      data: [
        {
          observed_at: "2026-06-11T00:00:00Z",
          numeric_value: 1013.64,
          unit: "metric_tonnes",
          source_url: "https://api.spdrgoldshares.com/",
        },
      ],
      error: null,
    });

    const response = await GET(request("gld-gold-holdings"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.limit).toHaveBeenCalledWith(30);
    expect(body).toMatchObject({
      driverKey: "gld-gold-holdings",
      seriesKey: "gld_tonnes",
      windowLimit: 30,
    });
  });

  it("allows a larger retained window for Pro", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "user-pro" });
    mocks.getUserPlanTierByUserId.mockResolvedValue("Pro");
    mocks.limit.mockResolvedValue({ data: [], error: null });

    await GET(request());

    expect(mocks.limit).toHaveBeenCalledWith(1_000);
  });

  it("supports TIPS real-yield history", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "user-free" });
    mocks.getUserPlanTierByUserId.mockResolvedValue("Free");
    mocks.limit.mockResolvedValue({
      data: [
        {
          observed_at: "2026-06-10T00:00:00Z",
          numeric_value: 2.21,
          unit: "percent",
          source_url: "https://fred.stlouisfed.org/series/DFII10",
        },
      ],
      error: null,
    });

    const response = await GET(request("tips-real-yield"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      driverKey: "tips-real-yield",
      seriesKey: "dfii10_yield_percent",
      unit: "percent",
    });
  });

  it("supports XAUUSD close history", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "user-pro" });
    mocks.getUserPlanTierByUserId.mockResolvedValue("Pro");
    mocks.limit.mockResolvedValue({
      data: [
        {
          observed_at: "2026-06-12T00:00:00Z",
          numeric_value: 4223.68,
          unit: "usd_per_troy_ounce",
          source_url: "https://twelvedata.com/docs",
        },
      ],
      error: null,
    });

    const response = await GET(request("xauusd-price-context"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      driverKey: "xauusd-price-context",
      seriesKey: "xauusd_close_usd",
      unit: "usd_per_troy_ounce",
    });
  });
});
