import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSupabaseAdminClient: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseAdminClient: mocks.getSupabaseAdminClient,
}));

import { POST } from "./route";

function payload(overrides: Record<string, unknown> = {}) {
  return {
    id: 92704,
    gateway: "ACB",
    transactionDate: "2026-06-13 16:30:00",
    accountNumber: "260234939",
    content: "DRALVO260613ABCDEF thanh toan",
    transferType: "in",
    description: "Payment",
    transferAmount: 499000,
    referenceCode: "FT2606130001",
    ...overrides,
  };
}

function request(body: unknown, authorization = "Apikey webhook-key") {
  return new Request("https://dralvo.test/api/sepay/webhook", {
    method: "POST",
    headers: {
      authorization,
      "content-type": "application/json",
      "x-forwarded-for": "203.0.113.71",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/sepay/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("SEPAY_WEBHOOK_API_KEY", "webhook-key");
    vi.stubEnv("VIETQR_BANK_BIN", "970416");
    vi.stubEnv("VIETQR_BANK_CODE", "ACB");
    vi.stubEnv("VIETQR_ACCOUNT_NO", "260234939");
    vi.stubEnv("VIETQR_ACCOUNT_NAME", "TRINH DINH HUAN");
    mocks.getSupabaseAdminClient.mockReturnValue({ rpc: mocks.rpc });
  });

  afterEach(() => vi.unstubAllEnvs());

  it("rejects requests without the configured API Key header", async () => {
    const response = await POST(request(payload(), "Bearer wrong"));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      success: false,
      error: "Unauthorized",
    });
  });

  it("acknowledges unrelated incoming transactions without activating Pro", async () => {
    const response = await POST(
      request(payload({ content: "unrelated bank transfer" })),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      success: true,
      ignored: true,
    });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("confirms a matching payment through the atomic database function", async () => {
    mocks.rpc.mockResolvedValue({
      data: [
        {
          result: "confirmed",
          payment_id: "payment-1",
          payment_user_id: "user-1",
        },
      ],
      error: null,
    });

    const response = await POST(request(payload()));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      status: "confirmed",
      reference: "DRALVO260613ABCDEF",
    });
    expect(mocks.rpc).toHaveBeenCalledWith(
      "confirm_sepay_vietqr_payment",
      expect.objectContaining({
        p_reference: "DRALVO260613ABCDEF",
        p_amount_vnd: 499000,
        p_provider_transaction_id: 92704,
        p_provider_reference_code: "FT2606130001",
      }),
    );
  });

  it("returns 500 so SePay retries when database confirmation fails", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { message: "database unavailable" },
    });

    const response = await POST(request(payload()));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      success: false,
      error: "Payment confirmation failed",
    });
  });
});
