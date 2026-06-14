import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  recordProductEvent: vi.fn(),
}));

vi.mock("@/lib/supabase/auth", () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
}));
vi.mock("@/lib/product-analytics", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/lib/product-analytics")>();
  return { ...original, recordProductEvent: mocks.recordProductEvent };
});

import { POST } from "./route";

function request(body: unknown) {
  return new Request("https://dralvo.test/api/analytics/events", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "203.0.113.41",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/analytics/events", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires authentication", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue(null);
    expect((await POST(request({}))).status).toBe(401);
  });

  it("rejects arbitrary event names and routes with query data", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "user-1" });

    expect(
      (
        await POST(
          request({
            event_name: "password_copied",
            route_path: "/dashboard",
          }),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await POST(
          request({
            event_name: "dashboard_view",
            route_path: "/dashboard?email=private@example.com",
          }),
        )
      ).status,
    ).toBe(400);
  });

  it("records an approved dashboard view", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "user-1" });
    mocks.recordProductEvent.mockResolvedValue(true);

    const response = await POST(
      request({
        event_name: "dashboard_view",
        route_path: "/dashboard/drivers",
        properties: { locale: "vi", email: "private@example.com" },
      }),
    );

    expect(response.status).toBe(201);
    expect(mocks.recordProductEvent).toHaveBeenCalledWith({
      userId: "user-1",
      eventName: "dashboard_view",
      routePath: "/dashboard/drivers",
      properties: { locale: "vi", email: "private@example.com" },
    });
  });
});
