import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSupabaseAdminClient: vi.fn(),
  from: vi.fn(),
  rpc: vi.fn(),
  recordRunLog: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseAdminClient: mocks.getSupabaseAdminClient,
}));

vi.mock("@/lib/run-logs", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/run-logs")>();
  return {
    ...original,
    recordRunLog: mocks.recordRunLog,
  };
});

import { GET } from "./route";

function request(secret = "cron-secret") {
  return new Request("https://dralvo.test/api/sepay/reconcile", {
    headers: {
      authorization: `Bearer ${secret}`,
      "x-forwarded-for": "203.0.113.45",
    },
  });
}

function mockPendingRows(rows: Array<Record<string, unknown>>) {
  const limit = vi.fn().mockResolvedValue({ data: rows, error: null });
  const order = vi.fn().mockReturnValue({ limit });
  const gte = vi.fn().mockReturnValue({ order });
  const eq = vi.fn().mockReturnValue({ gte });
  const select = vi.fn().mockReturnValue({ eq });
  mocks.from.mockReturnValue({ select });
}

describe("GET /api/sepay/reconcile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CRON_SECRET", "cron-secret");
    vi.stubEnv("SEPAY_API_TOKEN", "api-token");
    vi.stubEnv("VIETQR_BANK_BIN", "970416");
    vi.stubEnv("VIETQR_BANK_CODE", "ACB");
    vi.stubEnv("VIETQR_ACCOUNT_NO", "260234939");
    vi.stubEnv("VIETQR_ACCOUNT_NAME", "TRINH DINH HUAN");
    mocks.getSupabaseAdminClient.mockReturnValue({
      from: mocks.from,
      rpc: mocks.rpc,
    });
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("requires cron authorization", async () => {
    const response = await GET(request("wrong"));

    expect(response.status).toBe(401);
  });

  it("does not call SePay when there are no pending payment requests", async () => {
    mockPendingRows([]);

    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true,
      pending: 0,
      matched: 0,
      confirmed: 0,
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("confirms a matching pending request from SePay API v2 transactions", async () => {
    mockPendingRows([{ reference: "DRALVO260613ABCDEF", amount_vnd: 499000 }]);
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        data: [
          {
            id: 7654321,
            transaction_date: "2026-06-13 21:10:00",
            account_number: "260234939",
            transfer_type: "in",
            amount_in: 499000,
            amount_out: 0,
            accumulated: 1000000,
            transaction_content: "DRALVO260613ABCDEF",
            reference_number: "FT2606130003",
            bank_brand_name: "ACB",
          },
        ],
      }),
    } as never);
    mocks.rpc.mockResolvedValue({
      data: [{ result: "confirmed" }],
      error: null,
    });

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      pending: 1,
      fetched: 1,
      matched: 1,
      confirmed: 1,
    });
    expect(mocks.rpc).toHaveBeenCalledWith(
      "confirm_sepay_vietqr_payment",
      expect.objectContaining({
        p_reference: "DRALVO260613ABCDEF",
        p_amount_vnd: 499000,
        p_provider_transaction_id: 7654321,
      }),
    );
  });
});
