import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetchAllIndicators: vi.fn(),
  fetchIndicators: vi.fn(),
  getDueIndicatorKeys: vi.fn(),
  getMissingEvidenceIndicatorKeys: vi.fn(),
  mergeDueAndEvidenceBackfillKeys: vi.fn(),
  isCronAuthorized: vi.fn(),
  recordRunLog: vi.fn(),
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock("@/data/ingestion", () => ({
  fetchAllIndicators: mocks.fetchAllIndicators,
  fetchIndicators: mocks.fetchIndicators,
  getDueIndicatorKeys: mocks.getDueIndicatorKeys,
  getMissingEvidenceIndicatorKeys: mocks.getMissingEvidenceIndicatorKeys,
  mergeDueAndEvidenceBackfillKeys: mocks.mergeDueAndEvidenceBackfillKeys,
  INDICATOR_KEYS: ["one", "two"],
}));

vi.mock("@/lib/api-auth", () => ({
  isCronAuthorized: mocks.isCronAuthorized,
}));

vi.mock("@/lib/run-logs", () => ({
  recordRunLog: mocks.recordRunLog,
}));

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseAdminClient: mocks.getSupabaseAdminClient,
}));

import { GET } from "./route";

function snapshot(key: string) {
  return {
    key,
    name: key,
    source: "test",
    cadence: "test",
    value: "1",
    change: "0",
    status: "neutral" as const,
    summary: "test",
    observedAt: "2026-06-11T00:00:00Z",
    observedLabel: "Jun 11",
  };
}

function request() {
  return new Request("https://dralvo.test/api/ingest", {
    headers: { authorization: "Bearer test" },
  });
}

function supabaseMock() {
  const upsert = vi.fn().mockResolvedValue({ error: null });
  const latestQuery = {
    in: vi.fn(() => latestQuery),
    order: vi.fn(() => latestQuery),
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
  };

  return {
    from: vi.fn(() => ({
      select: vi.fn(() => latestQuery),
      upsert,
    })),
    upsert,
    latestQuery,
  };
}

describe("/api/ingest status contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isCronAuthorized.mockReturnValue(true);
    mocks.getDueIndicatorKeys.mockReturnValue(["one", "two"]);
    mocks.getMissingEvidenceIndicatorKeys.mockReturnValue([]);
    mocks.mergeDueAndEvidenceBackfillKeys.mockImplementation(
      (dueKeys: string[], backfillKeys: string[]) => [
        ...new Set([...dueKeys, ...backfillKeys]),
      ],
    );
  });

  it("returns success only when every indicator is written", async () => {
    mocks.fetchIndicators.mockResolvedValue([
      { key: "one", status: "success", data: snapshot("one") },
      { key: "two", status: "success", data: snapshot("two") },
    ]);
    mocks.getSupabaseAdminClient.mockReturnValue(supabaseMock());

    const response = await GET(request());
    const body = await response.json();

    expect(body).toMatchObject({
      ok: true,
      partial: false,
      status: "success",
      counts: { total: 2, written: 2, failed: 0 },
    });
  });

  it("returns partial when at least one indicator fails", async () => {
    mocks.fetchIndicators.mockResolvedValue([
      { key: "one", status: "success", data: snapshot("one") },
      { key: "two", status: "error", error: "upstream timeout" },
    ]);
    mocks.getSupabaseAdminClient.mockReturnValue(supabaseMock());

    const response = await GET(request());
    const body = await response.json();

    expect(body).toMatchObject({
      ok: false,
      partial: true,
      status: "partial",
      counts: { total: 2, written: 1, failed: 1 },
    });
    expect(mocks.recordRunLog).toHaveBeenCalledWith(
      expect.objectContaining({
        runType: "indicator_ingest",
        status: "error",
        metadata: expect.objectContaining({ partial: true }),
      }),
    );
  });

  it("skips indicators that are not due yet", async () => {
    mocks.getDueIndicatorKeys.mockReturnValue(["one"]);
    mocks.fetchIndicators.mockResolvedValue([
      { key: "one", status: "success", data: snapshot("one") },
    ]);
    mocks.getSupabaseAdminClient.mockReturnValue(supabaseMock());

    const response = await GET(request());
    const body = await response.json();

    expect(mocks.fetchIndicators).toHaveBeenCalledWith(["one"]);
    expect(body).toMatchObject({
      ok: true,
      status: "success",
      counts: { total: 1, written: 1, failed: 0, skipped: 1 },
      skipped: ["two"],
    });
  });

  it("forces indicators whose required evidence is missing", async () => {
    mocks.getDueIndicatorKeys.mockReturnValue(["one"]);
    mocks.getMissingEvidenceIndicatorKeys.mockReturnValue(["two"]);
    mocks.fetchIndicators.mockResolvedValue([
      { key: "one", status: "success", data: snapshot("one") },
      { key: "two", status: "success", data: snapshot("two") },
    ]);
    mocks.getSupabaseAdminClient.mockReturnValue(supabaseMock());

    const response = await GET(request());
    const body = await response.json();

    expect(mocks.mergeDueAndEvidenceBackfillKeys).toHaveBeenCalledWith(
      ["one"],
      ["two"],
    );
    expect(mocks.fetchIndicators).toHaveBeenCalledWith(["one", "two"]);
    expect(body.counts.skipped).toBe(0);
  });
});
