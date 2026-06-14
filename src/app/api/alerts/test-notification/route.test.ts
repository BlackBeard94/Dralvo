import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  getUserPlanTierByUserId: vi.fn(),
  getSupabaseAdminClient: vi.fn(),
  sendEmail: vi.fn(),
  sendTelegramMessage: vi.fn(),
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

vi.mock("@/lib/notifications/email", async () => {
  const actual = await vi.importActual<typeof import("@/lib/notifications/email")>(
    "@/lib/notifications/email",
  );
  return {
    ...actual,
    sendEmail: mocks.sendEmail,
  };
});

vi.mock("@/lib/notifications/telegram", async () => {
  const actual = await vi.importActual<typeof import("@/lib/notifications/telegram")>(
    "@/lib/notifications/telegram",
  );
  return {
    ...actual,
    sendTelegramMessage: mocks.sendTelegramMessage,
  };
});

import { POST } from "./route";

function request(ip = "203.0.113.90") {
  return new Request("https://dralvo.test/api/alerts/test-notification", {
    method: "POST",
    headers: {
      "x-forwarded-for": ip,
    },
  });
}

function supabaseMock(profile: unknown) {
  const single = vi.fn().mockResolvedValue({ data: profile, error: null });
  const eq = vi.fn(() => ({ single }));
  const select = vi.fn(() => ({ eq }));
  return {
    from: vi.fn(() => ({ select })),
  };
}

describe("/api/alerts/test-notification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sendEmail.mockResolvedValue(true);
    mocks.sendTelegramMessage.mockResolvedValue(true);
  });

  it("requires authentication", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue(null);

    const response = await POST(request());

    expect(response.status).toBe(401);
  });

  it("blocks Free users", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "user-1" });
    mocks.getUserPlanTierByUserId.mockResolvedValue("Free");

    const response = await POST(request("203.0.113.91"));

    expect(response.status).toBe(403);
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("sends enabled Pro notification channels", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "user-1" });
    mocks.getUserPlanTierByUserId.mockResolvedValue("Pro");
    mocks.getSupabaseAdminClient.mockReturnValue(
      supabaseMock({
        email: "user@example.com",
        telegram_chat_id: "123456",
        notification_prefs: {
          email: true,
          telegram: true,
          in_app: true,
        },
      }),
    );

    const response = await POST(request("203.0.113.92"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      dispatched: { email: true, telegram: true, in_app: false },
    });
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "user@example.com" }),
    );
    expect(mocks.sendTelegramMessage).toHaveBeenCalledWith(
      "123456",
      expect.stringContaining("Dralvo Test Alert"),
    );
  });
});
