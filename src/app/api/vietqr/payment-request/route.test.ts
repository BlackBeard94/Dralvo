import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  getSupabaseAdminClient: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@/lib/supabase/auth", () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
}));

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseAdminClient: mocks.getSupabaseAdminClient,
}));

import { GET } from "./route";

describe("GET /api/vietqr/payment-request", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("VIETQR_BANK_BIN", "970416");
    vi.stubEnv("VIETQR_BANK_CODE", "ACB");
    vi.stubEnv("VIETQR_ACCOUNT_NO", "260234939");
    vi.stubEnv("VIETQR_ACCOUNT_NAME", "TRINH DINH HUAN");
    vi.stubEnv("SEPAY_WEBHOOK_API_KEY", "webhook-key");
  });

  it("returns public VietQR availability without exposing bank details", async () => {
    const response = await GET(
      new Request("https://dralvo.test/api/vietqr/payment-request"),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      enabled: true,
      amountVnd: 499000,
      template: "compact",
    });
  });

  it("requires authentication when checking a payment reference", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue(null);

    const response = await GET(
      new Request(
        "https://dralvo.test/api/vietqr/payment-request?reference=DRALVO260613ABCDEF",
      ),
    );

    expect(response.status).toBe(401);
  });

  it("only reads a payment belonging to the authenticated user", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        reference: "DRALVO260613ABCDEF",
        status: "confirmed",
        confirmed_at: "2026-06-13T10:00:00.000Z",
        expires_at: "2026-06-15T10:00:00.000Z",
      },
      error: null,
    });
    const eqReference = vi.fn().mockReturnValue({ maybeSingle });
    const eqUser = vi.fn().mockReturnValue({ eq: eqReference });
    const select = vi.fn().mockReturnValue({ eq: eqUser });
    mocks.from.mockReturnValue({ select });
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "user-1" });
    mocks.getSupabaseAdminClient.mockReturnValue({ from: mocks.from });

    const response = await GET(
      new Request(
        "https://dralvo.test/api/vietqr/payment-request?reference=dralvo260613abcdef",
      ),
    );

    expect(response.status).toBe(200);
    expect(eqUser).toHaveBeenCalledWith("user_id", "user-1");
    expect(eqReference).toHaveBeenCalledWith(
      "reference",
      "DRALVO260613ABCDEF",
    );
    expect(await response.json()).toMatchObject({
      ok: true,
      payment: { status: "confirmed" },
    });
  });
});
