import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  getAlertsByUserId: vi.fn(),
  createAlert: vi.fn(),
  getUserPlanTierByUserId: vi.fn(),
  recordProductEvent: vi.fn(),
}));

vi.mock("@/lib/supabase/auth", () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
}));

vi.mock("@/lib/alerts", () => ({
  getAlertsByUserId: mocks.getAlertsByUserId,
  createAlert: mocks.createAlert,
}));

vi.mock("@/lib/subscription-gate", () => ({
  getUserPlanTierByUserId: mocks.getUserPlanTierByUserId,
}));
vi.mock("@/lib/product-analytics", () => ({
  recordProductEvent: mocks.recordProductEvent,
}));

import { GET, POST } from "./route";

function request(method: "GET" | "POST", body?: unknown) {
  return new Request("https://dralvo.test/api/alerts", {
    method,
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": `203.0.113.${method === "GET" ? "10" : "11"}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("/api/alerts plan gating", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no user is authenticated", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue(null);

    const response = await GET(request("GET"));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });

  it("blocks Free users from reading custom alerts", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "user-free" });
    mocks.getUserPlanTierByUserId.mockResolvedValue("Free");

    const response = await GET(request("GET"));

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "Custom alerts require Dralvo Pro.",
    });
    expect(mocks.getAlertsByUserId).not.toHaveBeenCalled();
  });

  it("allows Pro users to read alerts", async () => {
    const alerts = [{ id: "alert-1", indicator_key: "xauusd-spot" }];
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "user-pro" });
    mocks.getUserPlanTierByUserId.mockResolvedValue("Pro");
    mocks.getAlertsByUserId.mockResolvedValue(alerts);

    const response = await GET(request("GET"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(alerts);
    expect(mocks.getAlertsByUserId).toHaveBeenCalledWith("user-pro");
  });

  it("blocks Free users from creating alerts", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "user-free" });
    mocks.getUserPlanTierByUserId.mockResolvedValue("Free");

    const response = await POST(request("POST", {
      indicator_key: "xauusd-spot",
      condition_json: { operator: "gt", value: 4300 },
    }));

    expect(response.status).toBe(403);
    expect(mocks.createAlert).not.toHaveBeenCalled();
  });

  it("allows Pro users to create valid alerts", async () => {
    const input = {
      indicator_key: "xauusd-spot",
      condition_json: { operator: "gt", value: 4300 },
    };
    const created = { id: "alert-1", user_id: "user-pro", ...input };
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "user-pro" });
    mocks.getUserPlanTierByUserId.mockResolvedValue("Pro");
    mocks.createAlert.mockResolvedValue(created);
    mocks.recordProductEvent.mockResolvedValue(true);

    const response = await POST(request("POST", input));

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual(created);
    expect(mocks.createAlert).toHaveBeenCalledWith("user-pro", input);
    expect(mocks.recordProductEvent).toHaveBeenCalledWith({
      userId: "user-pro",
      eventName: "monitor_created",
      routePath: "/dashboard/alerts",
      properties: { target_type: "evidence" },
    });
  });
});
