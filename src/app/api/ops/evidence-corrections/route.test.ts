import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  isAdminEmail: vi.fn(),
  rpc: vi.fn(),
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock("@/lib/supabase/auth", () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
}));
vi.mock("@/lib/admin", () => ({ isAdminEmail: mocks.isAdminEmail }));
vi.mock("@/lib/supabase/server", () => ({
  getSupabaseAdminClient: mocks.getSupabaseAdminClient,
}));

import { POST } from "./route";

function request(body: unknown) {
  return new Request("https://dralvo.test/api/ops/evidence-corrections", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "203.0.113.52",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/ops/evidence-corrections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSupabaseAdminClient.mockReturnValue({ rpc: mocks.rpc });
  });

  it("requires an admin session", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue(null);
    expect((await POST(request({}))).status).toBe(401);

    mocks.getAuthenticatedUser.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
    });
    mocks.isAdminEmail.mockReturnValue(false);
    expect((await POST(request({}))).status).toBe(403);
  });

  it("rejects malformed corrections before calling the database", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({
      id: "admin-1",
      email: "admin@example.com",
    });
    mocks.isAdminEmail.mockReturnValue(true);

    const response = await POST(
      request({
        observationId: "not-a-uuid",
        correctedNumericValue: Number.NaN,
        reason: "short",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("calls the atomic correction RPC with the operator identity", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({
      id: "4a379572-e228-451a-b45d-a7b1fdcf1ad1",
      email: "admin@example.com",
    });
    mocks.isAdminEmail.mockReturnValue(true);
    mocks.rpc.mockResolvedValue({
      data: { id: "8e77fa93-858d-486e-b3b0-53a6a365e7e7", numeric_value: 42 },
      error: null,
    });

    const response = await POST(
      request({
        observationId: "8e77fa93-858d-486e-b3b0-53a6a365e7e7",
        correctedNumericValue: 42,
        reason: "Provider revised the published observation.",
        sourceUrl: "https://example.com/revision",
        metadata: { ticket: "DATA-12" },
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith("apply_evidence_correction", {
      p_observation_id: "8e77fa93-858d-486e-b3b0-53a6a365e7e7",
      p_corrected_numeric_value: 42,
      p_correction_reason: "Provider revised the published observation.",
      p_correction_source_url: "https://example.com/revision",
      p_correction_metadata: { ticket: "DATA-12" },
      p_applied_by: "4a379572-e228-451a-b45d-a7b1fdcf1ad1",
    });
  });
});
